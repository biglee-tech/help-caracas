"use client";

import Script from "next/script";

export function SwaggerUiEmbed() {
  const init = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SwaggerUIBundle({
      url: "/openapi.yaml",
      dom_id: "#swagger-ui",
      customCss: ".swagger-ui .topbar { display: none }",
    });
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={init}
      />
      <div id="swagger-ui" />
    </>
  );
}
