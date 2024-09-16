import type { ReportCallback, ReportOpts } from 'web-vitals';

/**
 * This function aims to provide an abstraction layer on Google's web-vitals library.
 * The function only loads the web-vitals library if necessary, hence keeping your bundle size small
 *
 * @param onReport An optional report handler (e.g console.log)
 */
async function reportWebVitals(onReport?: ReportCallback, opts?: ReportOpts) {
  if (onReport && onReport instanceof Function) {
    const { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } = await import('web-vitals');
    onCLS(onReport, opts);
    onFCP(onReport, opts);
    onFID(onReport, opts);
    onINP(onReport, opts);
    onLCP(onReport, opts);
    onTTFB(onReport, opts);
  }
}

export default reportWebVitals;
