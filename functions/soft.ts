export const onRequest: PagesFunction = async (context) => {
  // If this logs, the function works
  console.log("FUNCTION HIT FOR SOFT");
  
  const response = await context.next();
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append(`<meta property="og:title" content="TESTING META TAGS" />`, { html: true });
        element.append(`<title>TESTING META TAGS</title>`, { html: true });
      },
    })
    .transform(response);
};
