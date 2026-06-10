# GitHub Secrets requeridos

Configura estos secrets en Settings → Secrets and variables → Actions del repositorio.

## Backend CI/CD

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `RENDER_DEPLOY_HOOK_URL` | URL del deploy hook de Render | `https://api.render.com/deploy/srv-xxx?key=yyy` |

## Mobile CI/CD (EAS Build)

| Secret | Descripción | Cómo obtener |
|--------|-------------|--------------|
| `EXPO_TOKEN` | Token de autenticación de Expo/EAS | `eas whoami` → `expo.dev` → Account Settings → Access Tokens |

## Cómo obtener RENDER_DEPLOY_HOOK_URL

1. Ir a Render Dashboard → syncro-red-backend
2. Settings → Deploy Hook
3. Copiar la URL generada

## Cómo obtener EXPO_TOKEN

1. Instalar EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Ir a https://expo.dev/accounts/[tu-cuenta]/settings/access-tokens
4. Crear nuevo token con scope "Build"
