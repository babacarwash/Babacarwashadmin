/**
 * Admin Panel Activity Tracker
 * Tracks admin usage of the panel and sends batches to the backend.
 * Auto-tracks: page views, screen time, tab focus/blur, login/logout.
 * Manual: button_click, navigation, form_submit, search, filter, etc.
 */
import api from "../api/axiosInstance";

class AdminActivityTracker {
  constructor() {
    this._queue = [];
    this._sessionId = null;
    this._initialized = false;
    this._batchTimer = null;
    this._isFlushing = false;

    // Screen time
    this._currentPath = null;
    this._currentTitle = null;
    this._pageEnteredAt = null;

    // Tab visibility
    this._handleVisibility = this._onVisibilityChange.bind(this);
    this._handleBeforeUnload = this._onBeforeUnload.bind(this);
  }

  /* ── Initialize (call once after login / on app mount if logged in) ── */
  initialize() {
    if (this._initialized) return;

    this._sessionId = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this._initialized = true;

    // Flush every 8 seconds
    this._batchTimer = setInterval(() => this._flush(), 8000);

    // Listen for tab visibility
    document.addEventListener("visibilitychange", this._handleVisibility);
    window.addEventListener("beforeunload", this._handleBeforeUnload);

    console.log("[AdminTracker] ✅ Initialized | session:", this._sessionId);
  }

  /* ── Dispose (call on logout) ── */
  dispose() {
    this._recordScreenTime();
    this._flush();

    if (this._batchTimer) clearInterval(this._batchTimer);
    document.removeEventListener("visibilitychange", this._handleVisibility);
    window.removeEventListener("beforeunload", this._handleBeforeUnload);

    this._queue = [];
    this._sessionId = null;
    this._initialized = false;
    this._currentPath = null;
    this._currentTitle = null;
    this._pageEnteredAt = null;
    console.log("[AdminTracker] Disposed");
  }

  /* ── Device info ── */
  _getDevice() {
    const ua = navigator.userAgent;

    // Browser detection
    let browser = "Unknown";
    if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";

    // OS detection
    let os = "Unknown";
    if (ua.includes("Windows NT 10")) os = "Windows 10/11";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    // Device type
    const isMobile = /Mobi|Android/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobi)/i.test(ua);
    const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

    // Stable device fingerprint (same device always gets same ID)
    const fingerprint = `${browser}_${os}_${deviceType}_${window.screen.width}x${window.screen.height}`;
    const deviceId = btoa(fingerprint)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 16);

    return {
      deviceId,
      userAgent: ua,
      platform: navigator.platform,
      os,
      browser,
      deviceType,
      isMobile,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || "en",
      deviceLabel: `${browser} on ${os} (${deviceType} ${window.screen.width}x${window.screen.height})`,
    };
  }

  /* ── Core track method ── */
  track({
    activityType,
    pagePath,
    pageTitle,
    actionElement,
    actionValue,
    scrollDepth,
    scrollMaxDepth,
    duration,
    metadata,
  }) {
    if (!this._initialized) return;

    const activity = {
      sessionId: this._sessionId,
      activityType,
      timestamp: new Date().toISOString(),
      device: this._getDevice(),
    };

    if (pagePath || pageTitle) {
      activity.page = {};
      if (pagePath) activity.page.path = pagePath;
      if (pageTitle) activity.page.title = pageTitle;
    }
    if (actionElement || actionValue) {
      activity.action = {};
      if (actionElement) activity.action.element = actionElement;
      if (actionValue) activity.action.value = actionValue;
    }
    if (scrollDepth != null) {
      activity.scroll = { depth: scrollDepth };
      if (scrollMaxDepth != null) activity.scroll.maxDepth = scrollMaxDepth;
    }
    if (duration != null) activity.duration = duration;
    if (metadata) activity.metadata = metadata;

    this._queue.push(activity);

    if (this._queue.length >= 15) this._flush();
  }

  /* ── Page / Route tracking ── */
  trackPageView(path, title) {
    // Record time on the previous page first
    this._recordScreenTime();

    this._currentPath = path;
    this._currentTitle = title || this._titleFromPath(path);
    this._pageEnteredAt = Date.now();

    this.track({
      activityType: "page_view",
      pagePath: path,
      pageTitle: this._currentTitle,
    });
  }

  _recordScreenTime() {
    if (this._currentPath && this._pageEnteredAt) {
      const duration = Date.now() - this._pageEnteredAt;
      if (duration > 1000) {
        this.track({
          activityType: "screen_time",
          pagePath: this._currentPath,
          pageTitle: this._currentTitle,
          duration,
        });
      }
    }
  }

  _titleFromPath(path) {
    if (!path || path === "/") return "Dashboard";
    const segment = path.split("/").filter(Boolean).pop() || "";
    return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /* ── Convenience methods ── */
  trackLogin() {
    this.track({ activityType: "login" });
    this._flush();
  }

  trackLogout() {
    this._recordScreenTime();
    this.track({ activityType: "logout" });
    this._flush();
  }

  trackButtonClick(element, value, path) {
    this.track({
      activityType: "button_click",
      pagePath: path || this._currentPath,
      pageTitle: this._currentTitle,
      actionElement: element,
      actionValue: value,
    });
  }

  trackNavigation(to, from) {
    this.track({
      activityType: "navigation",
      pagePath: to,
      pageTitle: this._titleFromPath(to),
      actionElement: `Navigate: ${from || "unknown"} → ${to}`,
    });
  }

  trackSearch(query, path) {
    this.track({
      activityType: "search",
      pagePath: path || this._currentPath,
      pageTitle: this._currentTitle,
      actionElement: "Search",
      actionValue: query,
    });
  }

  trackFilter(filterName, filterValue, path) {
    this.track({
      activityType: "filter",
      pagePath: path || this._currentPath,
      pageTitle: this._currentTitle,
      actionElement: filterName,
      actionValue: filterValue,
    });
  }

  trackFormSubmit(formName, path) {
    this.track({
      activityType: "form_submit",
      pagePath: path || this._currentPath,
      pageTitle: this._currentTitle,
      actionElement: formName,
    });
  }

  trackScroll(depth) {
    this.track({
      activityType: "scroll",
      pagePath: this._currentPath,
      pageTitle: this._currentTitle,
      scrollDepth: Math.round(depth),
      scrollMaxDepth: 100,
    });
  }

  /* ── Tab visibility ── */
  _onVisibilityChange() {
    if (!this._initialized) return;
    if (document.hidden) {
      this._recordScreenTime();
      this.track({ activityType: "tab_blur" });
      this._flush();
    } else {
      // Reset page timer on re-focus
      this._pageEnteredAt = Date.now();
      this.track({ activityType: "tab_focus" });
    }
  }

  _onBeforeUnload() {
    if (!this._initialized) return;
    this._recordScreenTime();
    this.track({ activityType: "logout" });
    this._flushSync();
  }

  /* ── Flush queue to backend ── */
  async _flush() {
    if (this._isFlushing || this._queue.length === 0) return;
    this._isFlushing = true;

    const batch = [...this._queue];
    this._queue = [];

    try {
      await api.post("/admin-activities/batch", { activities: batch });
    } catch (err) {
      // Put back failed items (limit to 200 to prevent memory leak)
      this._queue = [...batch, ...this._queue].slice(0, 200);
      console.warn("[AdminTracker] Flush failed:", err.message);
    } finally {
      this._isFlushing = false;
    }
  }

  /* ── Sync flush for beforeunload (uses sendBeacon) ── */
  _flushSync() {
    if (this._queue.length === 0) return;
    const batch = [...this._queue];
    this._queue = [];

    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const url = `${baseUrl}/admin-activities/batch`;
      const blob = new Blob([JSON.stringify({ activities: batch })], {
        type: "application/json",
      });

      // sendBeacon doesn't support custom headers, so fall back to fetch keepalive
      if (navigator.sendBeacon && !token) {
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: JSON.stringify({ activities: batch }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      // best effort
    }
  }
}

// Singleton
const adminTracker = new AdminActivityTracker();
export default adminTracker;
