import 'dotenv/config';
import Stripe from 'stripe';
import fs from 'node:fs/promises';
const key=process.env.STRIPE_SECRET_KEY;
if(!key?.startsWith('sk_test_'))throw new Error('This setup helper requires a Stripe test secret key in the private .env file. Live account setup is separate.');
const stripe=new Stripe(key,{timeout:15000,maxNetworkRetries:2});
const updates={};
for(const {name,amount} of [{name:'Basic',amount:5900},{name:'Standard',amount:8900},{name:'Deluxe',amount:12900},{name:'Premium',amount:20000}]){
 const variable=`STRIPE_PRICE_${name.toUpperCase()}`,lookup=`egn_family_${name.toLowerCase()}_usd_month_v1`;
 let price;
 if(process.env[variable])price=await stripe.prices.retrieve(process.env[variable]);
 else{const existing=await stripe.prices.list({lookup_keys:[lookup],limit:10});price=existing.data[0];
 if(!price){const product=await stripe.products.create({name:`Executive Global Nanny — ${name} family membership`,metadata:{egnPlan:name}},{idempotencyKey:`egn-product-${lookup}`});price=await stripe.prices.create({product:product.id,unit_amount:amount,currency:'usd',recurring:{interval:'month'},lookup_key:lookup,metadata:{egnPlan:name}},{idempotencyKey:`egn-price-${lookup}`});}}
 if(!price.active||price.unit_amount!==amount||price.currency!=='usd'||price.recurring?.interval!=='month'||price.recurring.interval_count!==1)throw new Error(`Configured ${name} price does not match published pricing.`);
 updates[variable]=price.id;
}
let configuration;
if(process.env.STRIPE_PORTAL_CONFIGURATION)configuration=await stripe.billingPortal.configurations.retrieve(process.env.STRIPE_PORTAL_CONFIGURATION);
else{const configs=await stripe.billingPortal.configurations.list({limit:100});configuration=configs.data.find(c=>c.metadata?.egnPortal==='family_v1');}
const features={customer_update:{enabled:true,allowed_updates:['name','email','address']},invoice_history:{enabled:true},payment_method_update:{enabled:true},subscription_cancel:{enabled:true,mode:'at_period_end'},subscription_update:{enabled:false}};
if(configuration)configuration=await stripe.billingPortal.configurations.update(configuration.id,{features});
else configuration=await stripe.billingPortal.configurations.create({business_profile:{headline:'Manage your Executive Global Nanny membership'},features,metadata:{egnPortal:'family_v1'}},{idempotencyKey:'egn-portal-family-v1'});
updates.STRIPE_PORTAL_CONFIGURATION=configuration.id;
let env=await fs.readFile('.env','utf8');for(const [name,value] of Object.entries(updates)){const expression=new RegExp(`^${name}=.*$`,'m');env=expression.test(env)?env.replace(expression,`${name}=${value}`):env+`\n${name}=${value}`;}
await fs.writeFile('.env',env.trimEnd()+'\n','utf8');console.log('Stripe test monthly prices and billing portal configured. IDs saved privately to .env. Configure the webhook signing secret next. No payments were made.');
