import { useState, useRef } from 'react';
import Head from 'next/head';

export default function CaptchaVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const captchaRef = useRef(null);

  const handleVerification = async (token) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Verification failed (Status: ${response.status})`
        );
      }

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message);
      if (window.hcaptcha && captchaRef.current) {
        window.hcaptcha.reset(captchaRef.current);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
      </Head>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
        <h2>hCaptcha Verification</h2>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {!isVerified && (
          <div>
            <div
              ref={captchaRef}
              className="h-captcha"
              data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
              data-callback="onCaptchaVerified"
            ></div>
            <button
              onClick={() => {
                if (window.hcaptcha) {
                  const token = window.hcaptcha.getResponse();
                  if (token) {
                    handleVerification(token);
                  } else {
                    setError('Please complete the captcha');
                  }
                }
              }}
              disabled={isLoading}
              style={{ marginTop: 24, padding: '8px 24px' }}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}
        {isVerified && <div style={{ color: 'green' }}>Verified! Redirecting...</div>}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onCaptchaVerified = function(token) {
              // Optional: can call handleVerification(token) here for auto-submit
            }
          `,
        }}
      />
    </>
  );
}
