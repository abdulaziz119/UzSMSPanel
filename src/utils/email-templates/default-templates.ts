export const DEFAULT_EMAIL_TEMPLATES = {
  newsletter: {
    name: 'Newsletter Template',
    subject: 'Weekly Newsletter - {{date}}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; }
        .image { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
            <p>Weekly Newsletter</p>
        </div>
        <div class="content">
            <h2>Hello {{user_name}}!</h2>
            <p>Welcome to our weekly newsletter. Here's what's new this week:</p>
            
            <div style="margin: 20px 0;">
                <img src="{{featured_image}}" alt="Featured" class="image" style="margin-bottom: 15px;">
            </div>
            
            <h3>{{article_title}}</h3>
            <p>{{article_excerpt}}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{read_more_url}}" class="button">Read More</a>
            </div>
            
            <h3>Quick Updates</h3>
            <ul>
                <li>{{update_1}}</li>
                <li>{{update_2}}</li>
                <li>{{update_3}}</li>
            </ul>
        </div>
        <div class="footer">
            <p>{{company_name}} | {{company_address}}</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`,
    variables: {
      company_name: 'Your Company',
      user_name: 'Customer',
      date: new Date().toLocaleDateString(),
      featured_image: 'https://via.placeholder.com/600x200',
      article_title: 'Article Title',
      article_excerpt: 'Brief description of the article...',
      read_more_url: '#',
      update_1: 'First update',
      update_2: 'Second update', 
      update_3: 'Third update',
      company_address: 'Your Address',
      unsubscribe_url: '#'
    }
  },

  promotional: {
    name: 'Promotional Email',
    subject: 'Special Offer - {{discount_percent}}% Off!',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #dc3545; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .offer-box { background-color: #fff3cd; border: 2px dashed #ffc107; padding: 20px; text-align: center; margin: 20px 0; }
        .product-grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
        .product-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; width: 200px; }
        .cta-button { display: inline-block; padding: 15px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 SPECIAL OFFER 🎉</h1>
            <h2>{{discount_percent}}% OFF</h2>
            <p>Limited Time Only!</p>
        </div>
        <div class="content">
            <h2>Hi {{customer_name}}!</h2>
            
            <div class="offer-box">
                <h3>Save {{discount_percent}}% on {{product_category}}</h3>
                <p><strong>Promo Code: {{promo_code}}</strong></p>
                <p>Valid until {{expiry_date}}</p>
            </div>
            
            <h3>Featured Products</h3>
            <div class="product-grid">
                <div class="product-item">
                    <img src="{{product_1_image}}" alt="{{product_1_name}}" style="width: 100%; max-width: 150px;">
                    <h4>{{product_1_name}}</h4>
                    <p style="text-decoration: line-through;">{{product_1_old_price}}</p>
                    <p style="color: #dc3545; font-weight: bold;">{{product_1_new_price}}</p>
                </div>
                <div class="product-item">
                    <img src="{{product_2_image}}" alt="{{product_2_name}}" style="width: 100%; max-width: 150px;">
                    <h4>{{product_2_name}}</h4>
                    <p style="text-decoration: line-through;">{{product_2_old_price}}</p>
                    <p style="color: #dc3545; font-weight: bold;">{{product_2_new_price}}</p>
                </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{shop_url}}" class="cta-button">SHOP NOW</a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d;">
                Hurry! This offer expires on {{expiry_date}}. Don't miss out on these amazing deals.
            </p>
        </div>
        <div class="footer">
            <p>{{company_name}} | {{company_email}}</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`,
    variables: {
      customer_name: 'Valued Customer',
      discount_percent: '25',
      product_category: 'All Products',
      promo_code: 'SAVE25',
      expiry_date: new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString(),
      product_1_name: 'Product 1',
      product_1_image: 'https://via.placeholder.com/150',
      product_1_old_price: '$100',
      product_1_new_price: '$75',
      product_2_name: 'Product 2',
      product_2_image: 'https://via.placeholder.com/150',
      product_2_old_price: '$80',
      product_2_new_price: '$60',
      shop_url: '#',
      company_name: 'Your Store',
      company_email: 'contact@yourstore.com',
      unsubscribe_url: '#'
    }
  },

  transactional: {
    name: 'Transaction Confirmation',
    subject: 'Order Confirmation #{{order_number}}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
        .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold; background-color: #e9ecef; padding-left: 15px; padding-right: 15px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; }
        .status-badge { background-color: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Order Confirmed</h1>
            <p>Order #{{order_number}}</p>
        </div>
        <div class="content">
            <h2>Thank you, {{customer_name}}!</h2>
            <p>Your order has been confirmed and is being processed.</p>
            
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> {{order_number}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Status:</strong> <span class="status-badge">{{order_status}}</span></p>
                
                <h4>Items Ordered:</h4>
                <div class="item-row">
                    <span>{{item_1_name}}</span>
                    <span>{{item_1_price}}</span>
                </div>
                <div class="item-row">
                    <span>{{item_2_name}}</span>
                    <span>{{item_2_price}}</span>
                </div>
                <div class="item-row">
                    <span>Shipping</span>
                    <span>{{shipping_cost}}</span>
                </div>
                <div class="total-row">
                    <span>Total</span>
                    <span>{{total_amount}}</span>
                </div>
            </div>
            
            <h3>Shipping Information</h3>
            <p>
                {{shipping_name}}<br>
                {{shipping_address}}<br>
                {{shipping_city}}, {{shipping_state}} {{shipping_zip}}
            </p>
            
            <h3>What's Next?</h3>
            <p>We'll send you a tracking number once your order ships. Expected delivery: {{expected_delivery}}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Order</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions? Contact us at {{support_email}} or {{support_phone}}</p>
            <p>{{company_name}} | {{company_address}}</p>
        </div>
    </div>
</body>
</html>`,
    variables: {
      customer_name: 'John Doe',
      order_number: '12345',
      order_date: new Date().toLocaleDateString(),
      order_status: 'Confirmed',
      item_1_name: 'Product 1',
      item_1_price: '$50.00',
      item_2_name: 'Product 2', 
      item_2_price: '$30.00',
      shipping_cost: '$10.00',
      total_amount: '$90.00',
      shipping_name: 'John Doe',
      shipping_address: '123 Main St',
      shipping_city: 'City',
      shipping_state: 'State',
      shipping_zip: '12345',
      expected_delivery: new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString(),
      tracking_url: '#',
      support_email: 'support@company.com',
      support_phone: '(555) 123-4567',
      company_name: 'Your Company',
      company_address: 'Your Address'
    }
  }
};
