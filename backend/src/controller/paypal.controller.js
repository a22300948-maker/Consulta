export async function createPayPalorder(orderData) {
    try {
        const accessToken = await getAccessToken();
        const response = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'MXN',
                        value: orderData.total.toFixed(2)
                    }
                }]
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Error al crear el pago');
    }
}
