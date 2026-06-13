# Runable Integration Documentation

## Overview
This integration deploys the Urban Colorized Community Friends website and mobile app containers to runable.com automatically on every push to the main branch.

## Setup Instructions

### 1. Add Your Runable API Key
You must add your Runable API key as a GitHub secret:

1. Go to your repository settings: `Settings → Secrets and variables → Actions`
2. Click **New repository secret**
3. Name: `RUNABLE_API_KEY`
4. Value: Your Runable API key
5. Click **Add secret**

### 2. Directory Structure
Ensure your repository has the following structure:
```
urban--coloeized-community-Friends-/
├── web/
│   ├── Dockerfile
│   └── ... (web app files)
├── mobile/
│   ├── Dockerfile
│   └── ... (mobile app files)
└── .github/
    └── workflows/
        └── runable-deploy.yml
```

### 3. Dockerfiles
Create `Dockerfile` in both `web/` and `mobile/` directories:

**web/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 80
CMD ["npm", "start"]
```

**mobile/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build:mobile
EXPOSE 8080
CMD ["npm", "run", "start:mobile"]
```

## Workflow Details

### Trigger
- **Event**: Push to `main` branch
- **Automatic**: Yes, no manual intervention needed

### Steps
1. **Checkout**: Retrieves the latest code
2. **Docker Setup**: Prepares Docker buildx for multi-platform builds
3. **Authentication**: Logs into GitHub Container Registry with GitHub token
4. **Build Web Image**: Builds and pushes the web app container
5. **Build Mobile Image**: Builds and pushes the mobile app container
6. **Deploy Web**: Calls Runable API to deploy web container
7. **Deploy Mobile**: Calls Runable API to deploy mobile container
8. **Verify**: Confirms deployment initiation

## API Endpoints Called

### Deployment Endpoint
```
POST https://api.runable.com/deployments
```

### Request Format
```json
{
  "name": "service-name",
  "image": "container-image-url",
  "service_type": "web|mobile",
  "environment": "production",
  "port": 80 or 8080
}
```

### Authentication
- **Header**: `Authorization: Bearer <RUNABLE_API_KEY>`
- **Method**: API Key Bearer Token

## Monitoring Deployments

After pushing to main:
1. Go to your repository's **Actions** tab
2. Click the latest workflow run
3. Check the deployment logs for status
4. Visit runable.com dashboard to verify your apps are running

## Environment Variables

The workflow uses the following environment variables:
- `REGISTRY`: Container registry (ghcr.io - GitHub Container Registry)
- `IMAGE_NAME_WEB`: Web app image name
- `IMAGE_NAME_MOBILE`: Mobile app image name

## Customization

To modify the workflow:
1. Edit `.github/workflows/runable-deploy.yml`
2. Adjust ports, service types, or environment names as needed
3. Commit and push changes
4. Next deployment will use the updated configuration

## Troubleshooting

### Deployment Fails
- Verify `RUNABLE_API_KEY` is set correctly in repository secrets
- Check Docker build logs for errors
- Ensure Dockerfiles are properly configured
- Verify Runable API endpoints and format

### Images Not Building
- Ensure `web/Dockerfile` and `mobile/Dockerfile` exist
- Check for syntax errors in Dockerfiles
- Verify all dependencies are listed

### Authentication Issues
- Confirm API key is valid and has deployment permissions
- Check secret name is exactly `RUNABLE_API_KEY`
- Verify Bearer token format in curl requests

## Support
For issues with:
- **Runable API**: Visit runable.com documentation
- **GitHub Actions**: See [GitHub Actions Docs](https://docs.github.com/en/actions)
- **Docker**: See [Docker Documentation](https://docs.docker.com)

## Next Steps
1. Create/verify Dockerfiles in `web/` and `mobile/` directories
2. Add `RUNABLE_API_KEY` to repository secrets
3. Push to main branch to trigger the workflow
4. Monitor the deployment in the Actions tab
