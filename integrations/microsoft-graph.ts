import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
} from "@azure/msal-browser";
import { normalizeMatrix } from "@/integrations/normalization";
import type {
  GraphDriveSummary,
  GraphFileSummary,
  GraphSiteSummary,
  Microsoft365Config,
  Microsoft365Snapshot,
} from "@/types/sourcing";

const graphRoot = "https://graph.microsoft.com/v1.0";
const graphScopes = ["User.Read", "Sites.Read.All", "Files.Read.All"];
let client: PublicClientApplication | null = null;
let clientKey = "";

function validate(config: Microsoft365Config) {
  if (!config.tenantId.trim()) throw new Error("Tenant ID is required.");
  if (!/^[0-9a-f-]{36}$/i.test(config.clientId.trim())) throw new Error("A valid Entra application client ID is required.");
  if (!/^[a-z0-9.-]+\.sharepoint\.com$/i.test(config.sharePointHostname.trim())) throw new Error("Use a SharePoint hostname such as tenant.sharepoint.com.");
  if (!config.sitePath.trim().startsWith("/")) throw new Error("SharePoint site path must start with /sites/ or /teams/.");
}

function redirectUri() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${basePath}/workspace/`;
}

async function getClient(config: Microsoft365Config) {
  validate(config);
  const nextKey = `${config.tenantId.trim()}:${config.clientId.trim()}`;
  if (client && clientKey === nextKey) return client;
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId.trim(),
      authority: `https://login.microsoftonline.com/${config.tenantId.trim()}`,
      redirectUri: redirectUri(),
      postLogoutRedirectUri: redirectUri(),
    },
    cache: { cacheLocation: "sessionStorage" },
  };
  client = new PublicClientApplication(msalConfig);
  clientKey = nextKey;
  await client.initialize();
  return client;
}

async function getAccount(msal: PublicClientApplication) {
  const existing = msal.getActiveAccount() ?? msal.getAllAccounts()[0];
  if (existing) { msal.setActiveAccount(existing); return existing; }
  const result = await msal.loginPopup({ scopes: graphScopes, prompt: "select_account" });
  if (!result.account) throw new Error("Microsoft 365 sign-in did not return an account.");
  msal.setActiveAccount(result.account);
  return result.account;
}

async function getToken(msal: PublicClientApplication, account: AccountInfo) {
  try {
    return (await msal.acquireTokenSilent({ scopes: graphScopes, account })).accessToken;
  } catch (error) {
    if (!(error instanceof InteractionRequiredAuthError)) throw error;
    return (await msal.acquireTokenPopup({ scopes: graphScopes, account })).accessToken;
  }
}

async function graphGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${graphRoot}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(payload.error?.message || `Microsoft Graph returned ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

function graphPath(value: string) {
  return value.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export async function readMicrosoft365Snapshot(config: Microsoft365Config): Promise<Microsoft365Snapshot> {
  const msal = await getClient(config);
  const account = await getAccount(msal);
  const accessToken = await getToken(msal, account);
  const site = await graphGet<GraphSiteSummary>(`/sites/${config.sharePointHostname.trim()}:${config.sitePath.trim()}?$select=id,displayName,webUrl`, accessToken);
  const driveResponse = await graphGet<{ value: GraphDriveSummary[] }>(`/sites/${encodeURIComponent(site.id)}/drives?$select=id,name,webUrl`, accessToken);
  const selectedDrive = driveResponse.value.find((drive) => drive.id === config.driveId.trim()) ?? driveResponse.value.find((drive) => /documents/i.test(drive.name)) ?? driveResponse.value[0];
  if (!selectedDrive) throw new Error("No readable SharePoint document library was found.");

  const searchTerm = (config.searchTerm.trim() || "DPAX").replace(/'/g, "''");
  const fileResponse = await graphGet<{ value: GraphFileSummary[] }>(`/drives/${encodeURIComponent(selectedDrive.id)}/root/search(q='${encodeURIComponent(searchTerm)}')?$select=id,name,webUrl,lastModifiedDateTime,size&$top=25`, accessToken);
  let records: Microsoft365Snapshot["records"] = [];

  if (config.workbookItemId.trim() && config.worksheetName.trim()) {
    const sheet = graphPath(config.worksheetName.trim());
    const range = (config.workbookRange.trim() || "A1:Z250").replace(/'/g, "''");
    const matrix = await graphGet<{ text?: string[][]; values?: unknown[][] }>(`/drives/${encodeURIComponent(selectedDrive.id)}/items/${encodeURIComponent(config.workbookItemId.trim())}/workbook/worksheets/${sheet}/range(address='${range}')?$select=text,values`, accessToken);
    records = normalizeMatrix("SharePoint", matrix.text ?? matrix.values ?? []);
  }

  return {
    accountName: account.name || account.username,
    site,
    drives: driveResponse.value,
    files: fileResponse.value,
    selectedDriveId: selectedDrive.id,
    refreshedAt: new Date().toISOString(),
    records,
    worksheet: config.worksheetName.trim() || undefined,
    range: config.workbookRange.trim() || undefined,
  };
}

export async function disconnectMicrosoft365(config: Microsoft365Config) {
  const msal = await getClient(config);
  const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0];
  if (account) await msal.logoutPopup({ account, postLogoutRedirectUri: redirectUri() });
}
