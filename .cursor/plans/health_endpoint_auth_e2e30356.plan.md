---
name: Health Endpoint Auth
overview: Adicionar um endpoint GET /auth/health público que retorna status simples com timestamp.
todos:
  - id: deps
    content: "Instalar dependencias: @nestjs/typeorm, typeorm, mysql2, uuid"
    status: completed
  - id: env
    content: Configurar variaveis de ambiente para MySQL
    status: completed
  - id: database-config
    content: Criar configuracao TypeORM e adicionar ao AppModule
    status: completed
  - id: session-entity
    content: Criar entidade Session com indices
    status: completed
  - id: session-service
    content: Criar SessionService para gerenciar sessoes no MySQL
    status: completed
  - id: token-service-update
    content: "Atualizar TokenService: 30 dias, adicionar jti"
    status: completed
  - id: auth-service-update
    content: "Atualizar AuthService: criar sessao no login, implementar logout"
    status: completed
  - id: auth-controller-update
    content: Adicionar endpoints logout e logout-all
    status: completed
  - id: jwt-strategy-update
    content: Atualizar JwtStrategy para validar sessao ativa no MySQL
    status: completed
  - id: auth-module-update
    content: Atualizar AuthModule com TypeOrmModule e SessionService
    status: completed
---

# Endpoint Health no AuthController

## Alteração

Adicionar em [`src/auth/auth.controller.ts`](src/auth/auth.controller.ts) um endpoint `GET /auth/health`:

```typescript
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}
```

O endpoint será público (sem `@UseGuards`) e retornará:

```json
{
  "status": "ok",
  "timestamp": "2025-12-10T14:30:00.000Z"
}
```