import fetch from 'node-fetch';

const SHOPIFY_STOREFRONT_API_URL = 'https://anatta-test-store.myshopify.com/api/2023-04/graphql.json';
const STOREFRONT_TOKEN = '6d6dda47f54e5a5ff4e04d4822b4de91';

const getProductVariants = async (productName) => {
  const query = `
    {
      products(first: 10, query: "${productName}") {
        edges {
          node {
            title
            variants(first: 50) {
              edges {
                node {
                  title
                  priceV2 {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  return result.data.products.edges;
};

const main = async () => {
  const args = process.argv.slice(2);
  const productName = args[1];

  if (!productName) {
    console.error('Please provide a product name.');
    process.exit(1);
  }

  const products = await getProductVariants(productName);

  const variants = {};

  products.forEach(product => {
    if (product.node.title === productName) {
      product.node.variants.edges.forEach(variant => {
        const variantNumber = variant.node.title.split(' ')[0]; // Assuming variant names are in the form "2 / black", "3 / white", etc.
        if (!variants[variantNumber]) {
          variants[variantNumber] = {
            productName: product.node.title,
            variantName: variantNumber,
            price: parseInt(variant.node.priceV2.amount)
          };
        }
      });
    }
  });

  const uniqueVariants = Object.values(variants);
  uniqueVariants.sort((a, b) => a.price - b.price);

  uniqueVariants.forEach(variant => {
    console.log(`${variant.productName} - Variant ${variant.variantName} - price $${variant.price}`);
  });
};

main();
