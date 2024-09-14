import React, { useRef, useEffect } from "react";

interface PageEditorProps {
  code: string;
  html: string;
}

export const PageEditor: React.FC<PageEditorProps> = ({ code, html }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'RESIZE') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleScroll = (event: React.WheelEvent) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SCROLL', deltaY: event.deltaY }, '*');
    }
  };

  return (
    <div className="w-full h-full overflow-hidden" onWheel={handleScroll}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts"
      />
    </div>
  );
};
