using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using Dapper;
using BCrypt.Net;

namespace BackEnd;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Configurar JWT
        var jwtKey = builder.Configuration["Jwt:Key"] ?? "clave_super_segura_minimo_32_caracteres_12345";
        var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SIGAE";
        var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SIGAE_Client";
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
            };
        });

        builder.Services.AddAuthorization();
        builder.Services.AddRateLimiter(options =>
        {
            options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(
                httpContext => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
        });

        // CORS para React
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowReact", policy =>
            {
                policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        var app = builder.Build();

        app.UseRateLimiter();
        app.UseCors("AllowReact");
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseHttpsRedirection();

        // Helper conexión MySQL
        static IDbConnection CreateConnection(IConfiguration config)
        {
            var connectionString = config.GetConnectionString("Default");
            return new MySqlConnection(connectionString);
        }

        // Endpoint login
        app.MapPost("/api/auth/login", async (HttpContext httpContext, [FromBody] LoginRequest request, IConfiguration config) =>
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return Results.BadRequest(new { error = "Faltan credenciales" });

            using var conn = CreateConnection(config);
            const string sql = @"
                SELECT Usuario_Id, Usuario_Correo, Usuario_Contraseña, Usuario_Nombre_Completo,
                       Usuario_Estado_Cuenta, Es_Administrador, Es_Docente, Es_Apoderado
                FROM usuario WHERE Usuario_Correo = @Email";
            var user = await conn.QueryFirstOrDefaultAsync<Usuario>(sql, new { request.Email });

            if (user == null || !user.Usuario_Estado_Cuenta)
                return Results.Json(new { error = "Credenciales incorrectas o cuenta inhabilitada" }, statusCode: 401);

            bool valid = BCrypt.Net.BCrypt.Verify(request.Password, user.Usuario_Contraseña);
            if (!valid)
                return Results.Json(new { error = "Credenciales incorrectas" }, statusCode: 401);

            var roles = new List<string>();
            if (user.Es_Administrador) roles.Add("Administrador");
            if (user.Es_Docente) roles.Add("Docente");
            if (user.Es_Apoderado) roles.Add("Apoderado");

            var token = GenerateJwtToken(user.Usuario_Id.ToString(), user.Usuario_Correo!, roles, config);

            // Registrar sesión
            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();
            var expiresAt = DateTime.UtcNow.AddHours(2);
            const string insertSesion = @"
                INSERT INTO sesion (Sesion_Token_Acceso, Sesion_Fecha_Inicio, Sesion_Fecha_Expiracion,
                    Sesion_Direccion_IP, Sesion_Dispositivo, Sesion_Token_Expiracion, Usuario_Id)
                VALUES (@Token, @FechaInicio, @FechaExpiracion, @IP, @Dispositivo, @TokenExpiracion, @UserId)";
            await conn.ExecuteAsync(insertSesion, new
            {
                Token = token,
                FechaInicio = DateTime.UtcNow,
                FechaExpiracion = expiresAt,
                IP = ip,
                Dispositivo = userAgent.Length > 100 ? userAgent[..100] : userAgent,
                TokenExpiracion = expiresAt,
                UserId = user.Usuario_Id
            });

            return Results.Ok(new
            {
                user = new
                {
                    id = user.Usuario_Id,
                    nombre = user.Usuario_Nombre_Completo,
                    email = user.Usuario_Correo,
                    roles
                },
                token
            });
        }).WithName("Login").AllowAnonymous();

        // Endpoint forgot-password
        app.MapPost("/api/auth/forgot-password", async ([FromBody] ForgotRequest request, IConfiguration config) =>
        {
            if (string.IsNullOrEmpty(request.Email)) return Results.BadRequest();

            using var conn = CreateConnection(config);
            var userId = await conn.QueryFirstOrDefaultAsync<int?>("SELECT Usuario_Id FROM usuario WHERE Usuario_Correo = @Email", new { request.Email });
            if (userId == null)
                return Results.Ok(new { message = "Si el correo existe, recibirá un enlace" });

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var expires = DateTime.UtcNow.AddHours(1);
            const string insertSql = @"
                INSERT INTO solicitud_recuperacion (Solicitud_Recuperacion_Token, Solicitud_Recuperacion_Fecha_Expiracion,
                    Solicitud_Recuperacion_Fecha_Creacion, Solicitud_Recuperacion_Estado, Usuario_Id)
                VALUES (@Token, @Expires, @Created, 'Pendiente', @UserId)";
            await conn.ExecuteAsync(insertSql, new { Token = token, Expires = expires, Created = DateTime.UtcNow, UserId = userId });

            Console.WriteLine($"Enlace para restablecer: https://tudominio.com/reset-password?token={token}");

            return Results.Ok(new { message = "Si el correo existe, recibirá un enlace" });
        }).WithName("ForgotPassword").AllowAnonymous();

        // Endpoint reset-password
        app.MapPost("/api/auth/reset-password", async ([FromBody] ResetRequest request, IConfiguration config) =>
        {
            if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
                return Results.BadRequest();

            using var conn = CreateConnection(config);
            const string selectSql = @"
                SELECT s.Usuario_Id, u.Usuario_Correo
                FROM solicitud_recuperacion s
                INNER JOIN usuario u ON s.Usuario_Id = u.Usuario_Id
                WHERE s.Solicitud_Recuperacion_Token = @Token
                  AND s.Solicitud_Recuperacion_Fecha_Expiracion > @Now
                  AND s.Solicitud_Recuperacion_Estado = 'Pendiente'";
            var result = await conn.QueryFirstOrDefaultAsync<dynamic>(selectSql, new { Token = request.Token, Now = DateTime.UtcNow });
            if (result == null) return Results.BadRequest(new { error = "Token inválido o expirado" });

            var hashed = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            const string updatePass = "UPDATE usuario SET Usuario_Contraseña = @Hashed WHERE Usuario_Id = @UserId";
            await conn.ExecuteAsync(updatePass, new { Hashed = hashed, UserId = result.Usuario_Id });

            const string updateToken = "UPDATE solicitud_recuperacion SET Solicitud_Recuperacion_Estado = 'Usado' WHERE Solicitud_Recuperacion_Token = @Token";
            await conn.ExecuteAsync(updateToken, new { request.Token });

            return Results.Ok(new { message = "Contraseña actualizada correctamente" });
        }).WithName("ResetPassword").AllowAnonymous();

        // Endpoint select-role (requiere autenticación)
        app.MapPost("/api/auth/select-role", async (HttpContext httpContext, [FromBody] SelectRoleRequest request, IConfiguration config) =>
        {
            var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Results.Unauthorized();

            using var conn = CreateConnection(config);
            const string sql = "SELECT Es_Administrador, Es_Docente, Es_Apoderado FROM usuario WHERE Usuario_Id = @UserId";
            var userRoles = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new { UserId = int.Parse(userIdClaim) });
            if (userRoles == null) return Results.Unauthorized();

            bool hasRole = request.SelectedRole switch
            {
                "Administrador" => userRoles.Es_Administrador,
                "Docente" => userRoles.Es_Docente,
                "Apoderado" => userRoles.Es_Apoderado,
                _ => false
            };
            if (!hasRole) return Results.BadRequest(new { error = "Rol no autorizado" });

            var emailClaim = httpContext.User.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var newToken = GenerateJwtToken(userIdClaim, emailClaim, new List<string> { request.SelectedRole }, config);

            return Results.Ok(new { token = newToken });
        }).WithName("SelectRole").RequireAuthorization();

        app.Run();

        // Función local para generar JWT
        static string GenerateJwtToken(string userId, string email, List<string> roles, IConfiguration config)
        {
            var jwtKey = config["Jwt:Key"] ?? "clave_super_segura_minimo_32_caracteres_12345";
            var jwtIssuer = config["Jwt:Issuer"] ?? "SIGAE";
            var jwtAudience = config["Jwt:Audience"] ?? "SIGAE_Client";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

// Definiciones de records y clase
public record LoginRequest(string Email, string Password);
public record ForgotRequest(string Email);
public record ResetRequest(string Token, string NewPassword);
public record SelectRoleRequest(string SelectedRole);

public class Usuario
{
    public int Usuario_Id { get; set; }
    public string? Usuario_Correo { get; set; }
    public string? Usuario_Contraseña { get; set; }
    public string? Usuario_Nombre_Completo { get; set; }
    public bool Usuario_Estado_Cuenta { get; set; }
    public bool Es_Administrador { get; set; }
    public bool Es_Docente { get; set; }
    public bool Es_Apoderado { get; set; }
}