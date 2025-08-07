// pages/api/verify.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid token format' });
    }

    const hcaptchaRes = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const hcaptchaData = await hcaptchaRes.json();

    if (hcaptchaData.success) {
      return res.status(200).json({
        success: true,
        redirectUrl: process.env.SUCCESS_REDIRECT_URL,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: hcaptchaData['error-codes']
          ? hcaptchaData['error-codes'].join(', ')
          : 'Verification failed',
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}
