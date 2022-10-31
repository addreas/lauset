import { Box, ChakraProvider } from "@chakra-ui/react";
import { withEmotionCache } from "@emotion/react";
import { useContext, useEffect } from "react";
import type { MetaFunction } from "@remix-run/server-runtime";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { env } from "./config.client";
import ClientStyleContext from "./context.client";
import ServerStyleContext from "./context.server";

export const meta: MetaFunction = () => {
  return { title: "Authentication" };
};

const App = withEmotionCache((_, emotionCache) => {
  const serverSyleData = useContext(ServerStyleContext);
  const clientStyleData = useContext(ClientStyleContext);

  // Only executed on client
  useEffect(() => {
    // re-link sheet container
    emotionCache.sheet.container = document.head;
    // re-inject tags
    const tags = emotionCache.sheet.tags;
    emotionCache.sheet.flush();
    tags.forEach((tag) => {
      (emotionCache.sheet as any)._insertTag(tag);
    });
    // reset cache to reapply global styles
    clientStyleData.reset();
  }, []);

  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        {serverSyleData?.map(({ key, ids, css }) => (
          <style
            key={key}
            data-emotion={`${key} ${ids.join(" ")}`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: css }}
          />
        ))}
      </head>
      <body style={{ height: "100%" }}>
        <ChakraProvider>
          <Box
            minH="100%"
            backgroundColor="#4158D0"
            backgroundImage="linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)"
            py={16}
          >
            <Outlet />
          </Box>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
        {env.isDev && <LiveReload />}
      </body>
    </html>
  );
});

export default App;
