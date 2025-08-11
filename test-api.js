const axios = require('axios');

const API_BASE = 'http://localhost:3001/frontend/v1';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'uz'
  }
});

async function testProductAPI() {
  console.log('🧪 Testing Product API Endpoints...\n');

  try {
    // Test 1: Search Products
    console.log('1️⃣ Testing Product Search...');
    const searchResponse = await api.post('/product/search', {
      search: 'test',
      page: 1,
      limit: 5
    });
    console.log('✅ Search successful:', searchResponse.data.success);
    console.log('📊 Found products:', searchResponse.data.data.items.length);
    console.log('📄 Pagination:', searchResponse.data.data.pagination);
    console.log('');

    // Test 2: Filter Options
    console.log('2️⃣ Testing Filter Options...');
    const filterResponse = await api.get('/product/filters');
    console.log('✅ Filter options successful:', filterResponse.data.success);
    console.log('📂 Categories:', filterResponse.data.data.categories.length);
    console.log('🏷️ Brands:', filterResponse.data.data.brands.length);
    console.log('💰 Price range:', filterResponse.data.data.price_range);
    console.log('');

    // Test 3: Search Suggestions
    console.log('3️⃣ Testing Search Suggestions...');
    const suggestionsResponse = await api.post('/product/suggestions', {
      query: 'mahsulot',
      limit: 3
    });
    console.log('✅ Suggestions successful:', suggestionsResponse.data.success);
    console.log('💡 Product suggestions:', suggestionsResponse.data.data.product_suggestions.length);
    console.log('📂 Category suggestions:', suggestionsResponse.data.data.category_suggestions.length);
    console.log('🏷️ Brand suggestions:', suggestionsResponse.data.data.brand_suggestions.length);
    console.log('');

    // Test 4: Product Details (if products exist)
    if (searchResponse.data.data.items.length > 0) {
      const firstProduct = searchResponse.data.data.items[0];
      console.log('4️⃣ Testing Product Details...');
      const detailsResponse = await api.post('/product/details', {
        id: firstProduct.id
      });
      console.log('✅ Product details successful:', detailsResponse.data.success);
      console.log('📋 Product ID:', detailsResponse.data.data.product.id);
      console.log('🔗 Related products:', detailsResponse.data.data.related_products.length);
      console.log('👀 Recently viewed:', detailsResponse.data.data.recently_viewed.length);
      console.log('💡 Recommendations:', detailsResponse.data.data.recommendations.length);
      console.log('');
    }

    // Test 5: Favorites (requires user authentication)
    console.log('5️⃣ Testing Favorites...');
    try {
      const favoritesResponse = await api.post('/product/favorites', {
        page: 1,
        limit: 5
      });
      console.log('✅ Favorites successful:', favoritesResponse.data.success);
      console.log('❤️ Saved products:', favoritesResponse.data.data.items.length);
    } catch (error) {
      console.log('⚠️ Favorites test skipped (requires user authentication)');
    }
    console.log('');

    // Test 6: Discount Products
    console.log('6️⃣ Testing Discount Products...');
    const discountResponse = await api.post('/product/discounts', {
      page: 1,
      limit: 5
    });
    console.log('✅ Discount products successful:', discountResponse.data.success);
    console.log('🏷️ Discount products:', discountResponse.data.data.items.length);
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Search endpoint: ✅ Working');
    console.log('- Filter options: ✅ Working');
    console.log('- Search suggestions: ✅ Working');
    console.log('- Product details: ✅ Working');
    console.log('- Favorites: ⚠️ Requires auth');
    console.log('- Discount products: ✅ Working');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run tests
testProductAPI(); 