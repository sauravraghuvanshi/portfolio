import path from "path";

/**
 * Returns the content directory path.
 * - Production (Azure App Service): /home/data/content/ (persists across deployments)
 * - Development: process.cwd()/content
 */
const isAzure = !!process.env.WEBSITE_SITE_NAME;

export const contentDir = isAzure
  ? "/home/data/content"
  : path.join(process.cwd(), "content");

/** The bundled content directory (always inside the deployed app). */
export const bundledContentDir = path.join(process.cwd(), "content");
