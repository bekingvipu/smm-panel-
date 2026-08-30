// =========================================================
// LikeX SMM Panel — Supabase Auth Client Integration
// Handles: Google Sign-In, Email OTP, and Session Recovery
// =========================================================

const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';

// Initialize Supabase Client
try {
  if (window.supabase && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log('[LikeX Auth] Supabase Client initialized successfully.');
  } else {
    console.warn('[LikeX Auth] Supabase SDK script not loaded yet.');
  }
} catch (err) {
  console.error('[LikeX Auth] Initialization error:', err);
}

// 1. Trigger 1-Click Google OAuth Sign-In
window.signInWithGoogle = async function() {
  if (!window.supabaseClient) {
    alert('Authentication service is initializing. Please refresh and try again.');
    return;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
  } catch (err) {
    console.error('[LikeX Auth] Google Sign-In error:', err);
    if (window.store && window.store.showToast) {
      window.store.showToast('Google Sign-In error: ' + (err.message || err), 'error');
    } else {
      alert('Google Sign-In failed: ' + (err.message || err));
    }
  }
};

// 2. Request 6-Digit OTP to Gmail
window.sendEmailOtp = async function(email) {
  if (!window.supabaseClient) {
    return { error: { message: 'Authentication service not ready' } };
  }

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true
      }
    });

    return { data, error };
  } catch (err) {
    console.error('[LikeX Auth] Send OTP error:', err);
    return { error: err };
  }
};

// 3. Verify 6-Digit OTP from Gmail
window.verifyEmailOtp = async function(email, token) {
  if (!window.supabaseClient) {
    return { error: { message: 'Authentication service not ready' } };
  }

  try {
    const { data, error } = await window.supabaseClient.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email'
    });

    return { data, error };
  } catch (err) {
    console.error('[LikeX Auth] Verify OTP error:', err);
    return { error: err };
  }
};

let isAuthWorking = false;

// 4. Sign Out User
window.signOutUser = async function() {
  if (isAuthWorking) return;
  isAuthWorking = true;
  try {
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
  } catch (err) {
    console.warn('[LikeX Auth] Sign out error:', err);
  } finally {
    if (window.store && window.store.data && window.store.data.isLoggedIn) {
      window.store.logout(false); // Do not trigger supabase signOut again
    }
    isAuthWorking = false;
  }
};

// 5. Automatic Session Listener (Handles Google Redirect & Auto-Login)
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;

  try {
    // Check initial active session
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session && session.user && window.store) {
      const u = session.user;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0];
      const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture || null;
      if (!window.store.data.isLoggedIn || window.store.data.customer.email !== u.email) {
        window.store.login(name, u.email, avatar, false); // silent login without duplicate toast
      }
    }

    // Subscribe to auth state updates
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('[LikeX Auth] Auth state event:', event);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session && session.user && window.store) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0];
        const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture || null;
        if (!window.store.data.isLoggedIn || window.store.data.customer.email !== u.email) {
          window.store.login(name, u.email, avatar, true);
        }
      } else if (event === 'SIGNED_OUT' && window.store) {
        if (window.store.data.isLoggedIn) {
          window.store.logout(false); // Safe logout without re-triggering Supabase
        }
      }
    });
  } catch (err) {
    console.warn('[LikeX Auth] Session restore error:', err);
  }
});
