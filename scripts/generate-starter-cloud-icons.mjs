#!/usr/bin/env node
/**
 * Generates a starter set of cloud service icons as SVGs.
 *
 * These are intentionally minimalist placeholders (brand-color rounded squares
 * with a service abbreviation + small glyph hint) so the playground works out
 * of the box. Swap to the official Microsoft/AWS/GCP icon sets by dropping
 * their SVGs into public/cloud-icons/<cloud>/<category>/ and running
 * `npm run build:icon-manifest`.
 *
 * Run: node scripts/generate-starter-cloud-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "public", "cloud-icons");

const BRAND = {
  azure: { primary: "#0078D4", dark: "#005a9e", text: "#ffffff" },
  aws:   { primary: "#FF9900", dark: "#cc7a00", text: "#232F3E" },
  gcp:   { primary: "#4285F4", dark: "#1a73e8", text: "#ffffff" },
};

// Glyph shapes (added behind text to hint at category).
const GLYPHS = {
  compute:     '<rect x="14" y="22" width="36" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="14" y1="30" x2="50" y2="30" stroke="currentColor" stroke-width="2"/>',
  storage:     '<ellipse cx="32" cy="20" rx="18" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 20 v18 a18 5 0 0 0 36 0 v-18" fill="none" stroke="currentColor" stroke-width="2"/>',
  database:    '<ellipse cx="32" cy="18" rx="16" ry="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 18 v22 a16 4 0 0 0 32 0 v-22 M16 28 a16 4 0 0 0 32 0" fill="none" stroke="currentColor" stroke-width="2"/>',
  networking:  '<circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="2"/><line x1="18" y1="32" x2="46" y2="32" stroke="currentColor" stroke-width="2"/><ellipse cx="32" cy="32" rx="6" ry="14" fill="none" stroke="currentColor" stroke-width="2"/>',
  ai:          '<circle cx="32" cy="28" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 44 q12 -12 24 0" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="20" r="2" fill="currentColor"/><circle cx="42" cy="20" r="2" fill="currentColor"/>',
  identity:    '<circle cx="32" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 46 q14 -14 28 0" fill="none" stroke="currentColor" stroke-width="2"/>',
  integration: '<circle cx="20" cy="32" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="44" cy="32" r="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="25" y1="32" x2="39" y2="32" stroke="currentColor" stroke-width="2"/>',
  monitor:     '<polyline points="14,40 22,30 30,36 40,22 50,28" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="30" r="2" fill="currentColor"/><circle cx="40" cy="22" r="2" fill="currentColor"/>',
};

// Service catalog — slug, label, abbreviation.
const CATALOG = {
  azure: {
    compute:     [["app-service","App Service","AS"],["functions","Functions","FN"],["vm","Virtual Machines","VM"],["aks","AKS","AKS"],["container-apps","Container Apps","CA"],["batch","Batch","BAT"]],
    storage:     [["blob-storage","Blob Storage","BLB"],["files","Files","FIL"],["queues","Queues","Q"],["disks","Managed Disks","DSK"],["data-lake","Data Lake","DL"]],
    database:    [["sql-db","SQL Database","SQL"],["cosmos-db","Cosmos DB","COS"],["postgres","PostgreSQL","PG"],["redis","Cache for Redis","RDS"],["synapse","Synapse","SYN"]],
    networking:  [["vnet","Virtual Network","VNT"],["app-gateway","App Gateway","AGW"],["front-door","Front Door","FD"],["load-balancer","Load Balancer","LB"],["api-management","API Management","APIM"]],
    ai:          [["openai","Azure OpenAI","AOI"],["ai-foundry","AI Foundry","AIF"],["cognitive-search","AI Search","SRCH"],["speech","Speech","SPK"],["vision","Vision","VIS"]],
    identity:    [["entra-id","Microsoft Entra ID","EID"],["key-vault","Key Vault","KV"],["managed-identity","Managed Identity","MI"]],
    integration: [["service-bus","Service Bus","SB"],["event-grid","Event Grid","EG"],["event-hubs","Event Hubs","EH"],["logic-apps","Logic Apps","LA"]],
    monitor:     [["monitor","Azure Monitor","MON"],["app-insights","Application Insights","AI"],["log-analytics","Log Analytics","LOG"]],
  },
  aws: {
    compute:     [["ec2","EC2","EC2"],["lambda","Lambda","λ"],["ecs","ECS","ECS"],["eks","EKS","EKS"],["fargate","Fargate","FG"],["batch","Batch","BAT"]],
    storage:     [["s3","S3","S3"],["ebs","EBS","EBS"],["efs","EFS","EFS"],["glacier","Glacier","GLC"],["storage-gateway","Storage Gateway","SGW"]],
    database:    [["rds","RDS","RDS"],["dynamodb","DynamoDB","DDB"],["aurora","Aurora","AUR"],["elasticache","ElastiCache","EC"],["redshift","Redshift","RS"]],
    networking:  [["vpc","VPC","VPC"],["cloudfront","CloudFront","CF"],["route53","Route 53","R53"],["alb","ALB","ALB"],["api-gateway","API Gateway","AGW"]],
    ai:          [["bedrock","Bedrock","BR"],["sagemaker","SageMaker","SM"],["comprehend","Comprehend","CMP"],["rekognition","Rekognition","REK"],["polly","Polly","POL"]],
    identity:    [["iam","IAM","IAM"],["cognito","Cognito","COG"],["secrets-manager","Secrets Manager","SEC"]],
    integration: [["sqs","SQS","SQS"],["sns","SNS","SNS"],["eventbridge","EventBridge","EB"],["step-functions","Step Functions","SF"]],
    monitor:     [["cloudwatch","CloudWatch","CW"],["x-ray","X-Ray","XR"],["cloudtrail","CloudTrail","CT"]],
  },
  gcp: {
    compute:     [["compute-engine","Compute Engine","CE"],["cloud-run","Cloud Run","CR"],["gke","GKE","GKE"],["cloud-functions","Cloud Functions","CF"],["app-engine","App Engine","AE"],["batch","Batch","BAT"]],
    storage:     [["cloud-storage","Cloud Storage","CS"],["filestore","Filestore","FS"],["persistent-disk","Persistent Disk","PD"]],
    database:    [["cloud-sql","Cloud SQL","SQL"],["firestore","Firestore","FST"],["bigtable","Bigtable","BT"],["spanner","Spanner","SPN"],["bigquery","BigQuery","BQ"]],
    networking:  [["vpc","VPC","VPC"],["cloud-load-balancing","Load Balancing","LB"],["cloud-cdn","Cloud CDN","CDN"],["cloud-dns","Cloud DNS","DNS"],["api-gateway","API Gateway","AGW"]],
    ai:          [["vertex-ai","Vertex AI","VTX"],["gemini","Gemini","GEM"],["vision-ai","Vision AI","VIS"],["speech-to-text","Speech-to-Text","STT"],["natural-language","Natural Language","NL"]],
    identity:    [["iam","IAM","IAM"],["secret-manager","Secret Manager","SEC"],["cloud-identity","Cloud Identity","CID"]],
    integration: [["pub-sub","Pub/Sub","P/S"],["cloud-tasks","Cloud Tasks","CT"],["workflows","Workflows","WF"],["eventarc","Eventarc","EA"]],
    monitor:     [["cloud-monitoring","Cloud Monitoring","MON"],["cloud-logging","Cloud Logging","LOG"],["cloud-trace","Cloud Trace","TR"]],
  },
};

function svg({ cloud, category, abbr, label }) {
  const { primary, dark, text } = BRAND[cloud];
  const glyph = GLYPHS[category] || "";
  const fontSize = abbr.length <= 2 ? 22 : abbr.length === 3 ? 18 : 14;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg-${cloud}-${abbr}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="10" fill="url(#bg-${cloud}-${abbr})"/>
  <g opacity="0.18" color="${text}">${glyph}</g>
  <text x="32" y="38" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-weight="700" font-size="${fontSize}" fill="${text}">${abbr}</text>
</svg>`;
}

let count = 0;
for (const [cloud, categories] of Object.entries(CATALOG)) {
  for (const [category, services] of Object.entries(categories)) {
    const dir = join(ROOT, cloud, category);
    await mkdir(dir, { recursive: true });
    for (const [slug, label, abbr] of services) {
      const file = join(dir, `${slug}.svg`);
      await writeFile(file, svg({ cloud, category, abbr, label }));
      count++;
    }
  }
}
console.log(`✓ Generated ${count} starter SVG icons under public/cloud-icons/`);
