const redirectURL = "https://victorxlr.me"
const statusCode = 301


addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === 'GET') {
    return Response.redirect(redirectURL, statusCode)

  }
  let { url, quality } = await request.json()
  let tweetId = url.split('/').pop()
  let tweetUrl = `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&tweet_mode=extended`

  let twitterResponse = await getTwitterData(tweetUrl)
  let directUrl = await getMediaLink(twitterResponse, quality)

  return new Response(directUrl, {
    headers: { 'content-type': 'text/plain' }
  })
}

async function getTwitterData(requestURL) {
  const response = await fetch(requestURL, {
    headers: {
      authorization: `Bearer ${TWITTER_TOKEN}`
    }
  })
  return response.json()
}

async function getMediaLink(data, quality) {
  // Undefined if data.extended_entities has no values (no videos in the tweet)
  if (data.hasOwnProperty('extended_entities') &&
    data.extended_entities.media[0].video_info) {
    let videoSizes = calculateSize(data.extended_entities.media[0].video_info.variants)

    let videoURL

    if (quality === 'low') {
      videoURL = videoSizes[0]
    } else if (quality === "medium") {
      if (videoSizes.length > 1) videoURL = videoSizes[1]
    }
    else if (quality === "high") {
      if (videoSizes.length > 2) videoURL = videoSizes[videoSizes.length - 1]
      else if (videoSizes.length > 1) videoURL = videoSizes[1]
      else videoURL = videoSizes[0]
    }
    return videoURL.url
  } else return false
}

function calculateSize(vids) {
  // filtering only for mp4 vidoes
  vids = vids.filter(el => el.content_type === "video/mp4")
  vids.sort((a, b) => {
    return a.bitrate - b.bitrate
  })
  return vids
}