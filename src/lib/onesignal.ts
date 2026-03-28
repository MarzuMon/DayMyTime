// OneSignal Web SDK integration
const ONESIGNAL_APP_ID = '6f0e29ca-2132-4e05-abe5-2767f8be0f80';

let oneSignalInitialized = false;

export function initOneSignal() {
  if (typeof window === 'undefined' || oneSignalInitialized) return;
  oneSignalInitialized = true;

  // Defer OneSignal to after page is interactive (5s delay)
  const load = () => {
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      script.onload = () => {
        (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
        (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            await OneSignal.init({
              appId: ONESIGNAL_APP_ID,
              notifyButton: { enable: true },
              allowLocalhostAsSecureOrigin: true,
            });
          } catch (e) {
            console.warn('OneSignal init skipped:', (e as Error).message);
          }
        });
      };
      document.head.appendChild(script);
    }, 5000);
  };

  if (document.readyState === 'complete') {
    load();
  } else {
    window.addEventListener('load', load, { once: true });
  }
}

export async function sendPushNotification(title: string, message: string, url?: string) {
  // This calls the OneSignal REST API via an edge function
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: { title, message, url },
  });
  if (error) throw error;
  return data;
}
