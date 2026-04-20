import { paypalConfig } from "../config/paypal.config";
function getPaypalConfig() {
    return Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
}
export async function getAccessToken() {
    const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${getPaypalConfig()}`
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
}
