/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const ADMIN_GOOGLE_DRIVE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/XXXX_ABC?gid=0&single=true&output=csv";

async function handleRequest(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // Define routes and their corresponding handlers
  const routes = {
    "/": () => new Response("Hello, this is the homepage!"),
    "/about": () => new Response("This is the about page."),
    "/contact": () =>
      new Response("You can contact us at contact@example.com."),
    "/api/data": () => handleApiRequest(request),
    "/playlist.m3u": () => handlePlaylistRequest(request),
    // Add more routes here
  };

  // Check if the requested path matches any of the defined routes
  if (routes[pathname]) {
    // If there's a matching route, call its handler function
    return routes[pathname]();
  } else {
    // If no matching route is found, return a 404 Not Found response
    return new Response("404 Not Found", { status: 404 });
  }
}

async function handleApiRequest(request) {
  // Handle API requests, e.g., fetch data from a database or external API
  // This is just a placeholder function, you can replace it with your actual API logic
  return new Response("API data will be handled here.");
}

async function handlePlaylistRequest(request) {
  
    return await handleAdminPlaylistRequest(request);
  
}

async function handleAdminPlaylistRequest(request) {
  const csvResponse = await fetch(ADMIN_GOOGLE_DRIVE_CSV_URL);
  const csvText = await csvResponse.text();

  // Parse CSV
  const rows = csvText.split("\n").map((row) => row.split(","));

  // Create M3U playlist
  let m3u = "#EXTM3U\n";
  for (const row of rows) {
    const [
      active,
      ,
      region,
      code,
      category,
      group,
      tag,
      id,
      name,
      epgId,
      logoUrl,
      url,
      epgUrl,
      provider,
      notes,
      userAgent,
      referrer,
      host,
      lkeys,
    ] = row;
    if (active.toLowerCase() === "yes" && url) {
      m3u += `#EXTINF:-1 tvg-id="${id}" tvg-name="${name}" tvg-logo="${logoUrl}" group-title="${group}",${name}\n`;
      //m3u += `#EXTGRP:${category} | ${region} | ${tag}\n`;
      if (userAgent) {
        m3u += `#EXTVLCOPT:http-user-agent=${userAgent}\n`;
      }
      if (referrer) {
        m3u += `#EXTVLCOPT:http-referrer=${referrer}\n`;
      }
      if (host) {
        m3u += `#KODIPROP:inputstream.adaptive.stream_headers=Host=${host}\n`;
      }
      if (lkeys) {
        m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n#KODIPROP:inputstream.adaptive.license_key=${lkeys}\n`;
      }
      m3u += `${url}\n`;
    }
  }

  return new Response(m3u, {
    headers: {
      "Content-Type": "audio/x-mpegurl",
    },
  });
}

async function downloadFile(url) {
  const response = await fetch(url);
  const content = await response.text();
  return content;
}

async function arrayToM3U(channels) {
  var m3u = "#EXTM3U\n\n";
  var i;
  for (i = 0; i < channels.length; i = i + 1) {
    var channel = channels[i];
    var groupTitle =
      channel.isup === "2" ? "Down-" + channel.tvgroup : channel.tvgroup;
    var channelTitle =
      channel.isup === "2"
        ? channel.title +
          " - " +
          channel.last_down_from +
          " - CHKED - " +
          channel.humanized_time
        : channel.title;
    m3u =
      m3u +
      '#EXTINF:-1 tvg-id="' +
      channel.id +
      '" tvg-name="' +
      channelTitle +
      '" tvg-logo="' +
      channel.logo +
      '" group-title="' +
      groupTitle +
      '",' +
      channelTitle +
      "\n";
    m3u = m3u + channel.playurl + "\n\n";
  }

  return m3u;
}
