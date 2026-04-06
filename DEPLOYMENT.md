# Vercel Deployment Procedure

Due to the Vercel project configuration (`bachan-bento-box`) having a `rootDirectory` set to `bento-pwa`, deployments run from within the `bento-pwa` folder fail because Vercel looks for a nested `bento-pwa/bento-pwa` path.

### Correct Command
To deploy correctly from the `bento-pwa` directory, use the **prebuilt** workflow:

1. **Local Build**:
   ```bash
   npm run build
   ```

2. **Vercel Build (Cloud preparation)**:
   ```bash
   npx -y vercel@latest build --prod --yes
   ```

3. **Deploy Prebuilt**:
   ```bash
   npx -y vercel@latest deploy --prebuilt --prod --yes
   ```

**Important**: 
- Project Name: `bachan-bento-box`
- Production URL: [bachan-bento-box.vercel.app](https://bachan-bento-box.vercel.app)
