import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import {
  categories,
  products,
  productPrices,
  sales,
  saleItems,
  combos,
  comboProducts,
  storeConfig,
} from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

// ── Helpers ─────────────────────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const now = daysAgo(0);

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Iniciando seed de datos de demostración...\n');

  // ── 0. Configuración del Local ─────────────────────────────────────────
  console.log('⚙️  Creando configuración del local...');
  await db.insert(storeConfig).values({
    storeName: 'LimpiShop',
    phone: '+595 21 123456',
    email: 'contacto@limpishop.com',
    address: 'Av. Principal 1234',
    city: 'Asunción',
    taxId: '80012345-6',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  });
  console.log('   ✅ Configuración del local creada\n');

  // ── 1. Categorías ──────────────────────────────────────────────────────
  console.log('📁 Creando categorías...');
  const categoryData = [
    { name: 'Limpieza de pisos', description: 'Productos para todo tipo de pisos y superficies' },
    { name: 'Lavandería', description: 'Jabones, suavizantes y productos para ropa' },
    { name: 'Cocina', description: 'Desengrasantes, detergentes y limpiadores de cocina' },
    { name: 'Baño', description: 'Desinfectantes y limpiadores para baños' },
    { name: 'Automotor', description: 'Productos de limpieza para vehículos' },
    { name: 'Multiuso', description: 'Limpiadores de uso general' },
  ];

  const insertedCategories = await db.insert(categories).values(
    categoryData.map(c => ({ ...c, createdAt: daysAgo(30), updatedAt: daysAgo(30) }))
  ).returning();
  console.log(`   ✅ ${insertedCategories.length} categorías creadas`);

  // Mapa rápido nombre → id
  const catMap: Record<string, { id: number; name: string }> = {};
  for (const c of insertedCategories) {
    catMap[c.name] = { id: c.id, name: c.name };
  }

  // ── 2. Productos ───────────────────────────────────────────────────────
  console.log('📦 Creando productos...');
  const productData = [
    // Limpieza de pisos
    { name: 'Lavandina concentrada', cost: 300, stock: 45, description: 'Lavandina concentrada al 4%. Desinfecta y blanquea.', cat: 'Limpieza de pisos', active: true, featured: true },
    { name: 'Limpiador de pisos lavanda', cost: 250, stock: 60, description: 'Limpiador líquido con aroma a lavanda. Rinde hasta 20 lts.', cat: 'Limpieza de pisos', active: true, featured: true },
    { name: 'Limpiador de pisos pino', cost: 250, stock: 55, description: 'Limpiador líquido con aroma a pino fresco.', cat: 'Limpieza de pisos', active: true, featured: false },
    { name: 'Cera líquida para pisos', cost: 400, stock: 25, description: 'Cera autobrillante para pisos de cerámica y mosaico.', cat: 'Limpieza de pisos', active: true, featured: false },
    { name: 'Desodorante de pisos cherry', cost: 200, stock: 70, description: 'Desodorante concentrado aroma cherry.', cat: 'Limpieza de pisos', active: true, featured: false },

    // Lavandería
    { name: 'Jabón líquido para ropa', cost: 350, stock: 50, description: 'Jabón líquido concentrado. Para lavar a mano o en lavarropas.', cat: 'Lavandería', active: true, featured: true },
    { name: 'Suavizante para ropa', cost: 300, stock: 40, description: 'Suavizante con fragancia duradera. Deja la ropa ultra suave.', cat: 'Lavandería', active: true, featured: true },
    { name: 'Quitamanchas líquido', cost: 280, stock: 30, description: 'Elimina las manchas más difíciles sin dañar los tejidos.', cat: 'Lavandería', active: true, featured: false },
    { name: 'Blanqueador óptico', cost: 320, stock: 20, description: 'Devuelve el blanco a las prendas. Sin cloro.', cat: 'Lavandería', active: true, featured: false },

    // Cocina
    { name: 'Detergente concentrado', cost: 200, stock: 80, description: 'Detergente lavavajillas ultra concentrado. Alto poder desengrasante.', cat: 'Cocina', active: true, featured: true },
    { name: 'Desengrasante de cocina', cost: 350, stock: 35, description: 'Desengrasante industrial. Elimina grasa quemada al instante.', cat: 'Cocina', active: true, featured: false },
    { name: 'Limpiador de hornos', cost: 500, stock: 15, description: 'Fórmula especial para hornos y parrillas.', cat: 'Cocina', active: true, featured: false },

    // Baño
    { name: 'Limpiador de baños', cost: 300, stock: 40, description: 'Limpiador desinfectante con acción antihongos.', cat: 'Baño', active: true, featured: false },
    { name: 'Destapa cañerías', cost: 450, stock: 20, description: 'Destapa cañerías líquido de acción rápida.', cat: 'Baño', active: true, featured: false },
    { name: 'Gel desinfectante WC', cost: 280, stock: 50, description: 'Gel desinfectante y desincrustante para inodoros.', cat: 'Baño', active: true, featured: true },

    // Automotor
    { name: 'Shampoo para autos', cost: 350, stock: 30, description: 'Shampoo neutro con cera. No daña la pintura.', cat: 'Automotor', active: true, featured: false },
    { name: 'Silicona para tablero', cost: 400, stock: 25, description: 'Silicona en crema para tableros y plásticos.', cat: 'Automotor', active: true, featured: false },
    { name: 'Limpiavidrios automotor', cost: 250, stock: 35, description: 'Limpiavidrios antiempañante para vehículos.', cat: 'Automotor', active: true, featured: false },

    // Multiuso
    { name: 'Limpiador multiuso', cost: 220, stock: 65, description: 'Limpiador todo en uno. Apto para múltiples superficies.', cat: 'Multiuso', active: true, featured: true },
    { name: 'Alcohol en gel', cost: 280, stock: 50, description: 'Alcohol en gel al 70%. Desinfectante de manos.', cat: 'Multiuso', active: true, featured: false },
    { name: 'Limpiavidrios multiuso', cost: 230, stock: 40, description: 'Limpiavidrios con gatillo. Deja sin marcas.', cat: 'Multiuso', active: true, featured: false },

    // Producto inactivo (para demostrar el filtro)
    { name: 'Cera en pasta (descontinuado)', cost: 500, stock: 0, description: 'Cera en pasta para pisos de madera. PRODUCTO DESCONTINUADO.', cat: 'Limpieza de pisos', active: false, featured: false },
  ];

  const insertedProducts = [];
  for (const p of productData) {
    const cat = catMap[p.cat];
    const [product] = await db.insert(products).values({
      name: p.name,
      cost: p.cost,
      stock: p.stock,
      description: p.description,
      categoryId: cat.id,
      categoryName: cat.name,
      active: p.active,
      featured: p.featured,
      createdAt: daysAgo(28),
      updatedAt: daysAgo(Math.floor(Math.random() * 7)),
    }).returning();
    insertedProducts.push(product);
  }
  console.log(`   ✅ ${insertedProducts.length} productos creados`);

  // ── 3. Precios por producto (variantes de cantidad) ────────────────────
  console.log('💲 Asignando precios...');
  let priceCount = 0;

  // Precio base por medio litro, 1 litro, 5 litros (ajustado por costo)
  for (const product of insertedProducts) {
    const base = (product.cost || 200) * 2.5; // margen ~150%
    const priceTiers = [
      { quantity: 1, price: Math.round(base / 2 / 50) * 50 },         // 1/2 litro
      { quantity: 2, price: Math.round(base / 50) * 50 },              // 1 litro
      { quantity: 10, price: Math.round((base * 4.5) / 100) * 100 },   // 5 litros
    ];

    await db.insert(productPrices).values(
      priceTiers.map(t => ({
        productId: product.id,
        quantity: t.quantity,
        price: t.price,
      }))
    );
    priceCount += priceTiers.length;
  }
  console.log(`   ✅ ${priceCount} precios asignados`);

  // ── 4. Combos ──────────────────────────────────────────────────────────
  console.log('🎁 Creando combos...');

  const comboData = [
    {
      name: 'Combo Hogar Completo',
      description: 'Todo lo que necesitás para mantener tu hogar impecable',
      discount: 15,
      active: true,
      products: [
        { name: 'Limpiador de pisos lavanda', qty: 2 },
        { name: 'Detergente concentrado', qty: 2 },
        { name: 'Limpiador de baños', qty: 1 },
        { name: 'Limpiavidrios multiuso', qty: 1 },
      ],
    },
    {
      name: 'Combo Lavandería',
      description: 'Kit completo para el cuidado de tu ropa',
      discount: 10,
      active: true,
      products: [
        { name: 'Jabón líquido para ropa', qty: 2 },
        { name: 'Suavizante para ropa', qty: 1 },
        { name: 'Quitamanchas líquido', qty: 1 },
      ],
    },
    {
      name: 'Combo Auto Reluciente',
      description: 'Dejá tu vehículo como nuevo',
      discount: 12,
      active: true,
      products: [
        { name: 'Shampoo para autos', qty: 2 },
        { name: 'Silicona para tablero', qty: 1 },
        { name: 'Limpiavidrios automotor', qty: 1 },
      ],
    },
    {
      name: 'Combo Cocina Impecable',
      description: 'Desengrasá y limpiá toda tu cocina a fondo',
      discount: 10,
      active: true,
      products: [
        { name: 'Detergente concentrado', qty: 2 },
        { name: 'Desengrasante de cocina', qty: 1 },
        { name: 'Limpiador de hornos', qty: 1 },
      ],
    },
  ];

  // Mapa producto nombre → { id, price del litro (qty=2) }
  const prodMap: Record<string, { id: number; price: number }> = {};
  for (const p of insertedProducts) {
    const base = (p.cost || 200) * 2.5;
    prodMap[p.name] = { id: p.id, price: Math.round(base / 50) * 50 };
  }

  for (const combo of comboData) {
    const comboProductsList = combo.products.map(cp => ({
      productId: prodMap[cp.name].id,
      productName: cp.name,
      quantity: cp.qty,
      price: prodMap[cp.name].price,
    }));

    const originalPrice = comboProductsList.reduce((sum, cp) => sum + cp.price * cp.quantity, 0);
    const finalPrice = Math.round(originalPrice * (1 - combo.discount / 100));

    const [insertedCombo] = await db.insert(combos).values({
      name: combo.name,
      description: combo.description,
      originalPrice,
      discountPercentage: combo.discount,
      finalPrice,
      active: combo.active,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(2),
    }).returning();

    await db.insert(comboProducts).values(
      comboProductsList.map(cp => ({ comboId: insertedCombo.id, ...cp }))
    );
  }
  console.log(`   ✅ ${comboData.length} combos creados`);

  // ── 5. Ventas de los últimos 30 días ───────────────────────────────────
  console.log('🧾 Generando historial de ventas...');

  const paymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
  let saleCount = 0;

  // Generar ~40 ventas distribuidas en los últimos 30 días
  for (let day = 30; day >= 0; day--) {
    // Entre 0 y 3 ventas por día
    const salesPerDay = day === 0 ? 2 : Math.floor(Math.random() * 3) + (day % 3 === 0 ? 1 : 0);

    for (let s = 0; s < salesPerDay; s++) {
      // Elegir 1 a 4 productos aleatorios
      const numItems = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...insertedProducts]
        .filter(p => p.active)
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);

      const items = shuffled.map(p => {
        const basePrice = (p.cost || 200) * 2.5;
        const price = Math.round(basePrice / 50) * 50; // precio 1 litro
        const quantity = Math.floor(Math.random() * 3) + 1;
        return {
          productId: p.id,
          productName: p.name,
          quantity,
          price,
          size: 2, // 1 litro (quantity=2 en product_prices)
          total: price * quantity,
        };
      });

      const grandTotal = items.reduce((sum, i) => sum + i.total, 0);
      const dateStr = daysAgo(day);

      const [sale] = await db.insert(sales).values({
        grandTotal,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        date: dateStr,
        createdAt: dateStr,
      }).returning();

      await db.insert(saleItems).values(
        items.map(i => ({ saleId: sale.id, ...i }))
      );

      saleCount++;
    }
  }
  console.log(`   ✅ ${saleCount} ventas generadas`);

  // ── Fin ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('   Podés iniciar la app con: npm run dev');
  console.log('   Login con contraseña: 123\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
