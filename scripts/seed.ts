import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Seeding dummy products and categories...");

  // 1. Categories
  const categories = [
    { id: randomUUID(), name: "Fresh Fruits", slug: "fruits" },
    { id: randomUUID(), name: "Vegetables", slug: "vegetables" },
    { id: randomUUID(), name: "Dairy & Eggs", slug: "dairy" },
    { id: randomUUID(), name: "Bakery", slug: "bakery" },
  ];

  for (const cat of categories) {
    await supabase.from("categories").upsert(cat, { onConflict: "slug" });
  }
  console.log("Categories seeded!");

  // Get them back to link relationships
  const { data: catData } = await supabase.from("categories").select("id, slug");
  if (!catData) throw new Error("Could not fetch categories");

  const catMap = catData.reduce((acc, c) => ({ ...acc, [c.slug]: c.id }), {} as Record<string, string>);

  // 2. Products
  const products = [
    {
      id: randomUUID(),
      name: "Organic Bananas",
      slug: "organic-bananas",
      description: "Sweet, perfectly ripe organic bananas from Ecuador.",
      categoryId: catMap["fruits"],
      priceCents: 299,
      unit: "LB",
      stock: 150,
      lowStockThreshold: 20,
      popularityScore: 10,
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1571501478200-c5e4e6659c1e?w=800&q=80"
    },
    {
      id: randomUUID(),
      name: "Fresh Strawberries",
      slug: "fresh-strawberries",
      description: "Plump, juicy local strawberries. Perfect for snacking or desserts.",
      categoryId: catMap["fruits"],
      priceCents: 499,
      unit: "PACK",
      stock: 45,
      lowStockThreshold: 10,
      popularityScore: 25,
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80"
    },
    {
      id: randomUUID(),
      name: "Baby Spinach",
      slug: "baby-spinach",
      description: "Pre-washed, ready-to-eat baby spinach leaves.",
      categoryId: catMap["vegetables"],
      priceCents: 349,
      unit: "PACK",
      stock: 60,
      lowStockThreshold: 15,
      popularityScore: 5,
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80"
    },
    {
      id: randomUUID(),
      name: "Whole Milk",
      slug: "whole-milk",
      description: "Rich and creamy whole milk from pasture-raised cows.",
      categoryId: catMap["dairy"],
      priceCents: 450,
      unit: "LITER",
      stock: 100,
      lowStockThreshold: 10,
      popularityScore: 30,
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80"
    },
    {
      id: randomUUID(),
      name: "Sourdough Bread",
      slug: "sourdough-bread",
      description: "Artisan sourdough bread baked fresh daily. Crispy crust, chewy inside.",
      categoryId: catMap["bakery"],
      priceCents: 599,
      unit: "EACH",
      stock: 20,
      lowStockThreshold: 5,
      popularityScore: 18,
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800&q=80"
    }
  ];

  for (const p of products) {
    const { imageUrl, ...productData } = p;
    await supabase.from("products").upsert(productData, { onConflict: "slug" });
    
    // Add image
    const { data: insertedProduct } = await supabase.from("products").select("id").eq("slug", p.slug).single();
    if (insertedProduct) {
      // Clear existing images to avoid duplicates
      await supabase.from("product_images").delete().eq("productId", insertedProduct.id);
      
      await supabase.from("product_images").insert({
        id: randomUUID(),
        productId: insertedProduct.id,
        url: imageUrl,
        alt: p.name,
        sortOrder: 0
      });
    }
  }

  console.log("Successfully seeded 5 products!");
}

main().catch(console.error);
