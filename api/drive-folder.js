// Create a folder in Google Drive
// Used by Social Studio to create per-post subfolders

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsJson) {
    return res.status(500).json({ error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' });
  }

  try {
    const creds = JSON.parse(credsJson);
    const token = await getAccessToken(creds);
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name required' });
    }

    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    };

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    const data = await createRes.json();
    if (!createRes.ok) {
      return res.status(createRes.status).json({ error: data.error?.message || 'Folder creation failed' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Reuse JWT auth from drive-upload.js
async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaim = base64url(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;
  const key = await importPrivateKey(creds.private_key);
  const signature = await sign(key, signatureInput);
  const jwt = `${signatureInput}.${signature}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token exchange failed');
  return tokenData.access_token;
}

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function importPrivateKey(pem) {
  const pemContents = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\n/g, '');
  const binaryDer = Buffer.from(pemContents, 'base64');
  return crypto.subtle.importKey('pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}
async function sign(key, data) {
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
  return Buffer.from(sig).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
