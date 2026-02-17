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
  stockMovements,
  cashRegisters,
  cashMovements,
  employees,
} from './schema';
import { eq } from 'drizzle-orm';

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

function daysAgoWithHour(n: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const now = daysAgo(0);

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Iniciando seed de datos de demostración...\n');

  // ── 0. Limpiar tablas (orden respeta FK constraints) ───────────────────
  console.log('🗑️  Limpiando tablas existentes...');
  await db.delete(stockMovements);
  await db.delete(cashMovements);
  await db.delete(saleItems);
  await db.delete(sales);
  await db.delete(comboProducts);
  await db.delete(combos);
  await db.delete(productPrices);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(cashRegisters);
  await db.delete(employees);
  await db.delete(storeConfig);
  console.log('   ✅ Tablas limpiadas\n');

  // ── 1. Configuración del Local ─────────────────────────────────────────
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

  // ── 2. Categorías ──────────────────────────────────────────────────────
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

  // ── 3. Productos + Stock Inicial ───────────────────────────────────────
  console.log('📦 Creando productos con stock inicial...');
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
  const productCreatedAt = daysAgo(28);

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
      createdAt: productCreatedAt,
      updatedAt: daysAgo(Math.floor(Math.random() * 7)),
    }).returning();
    insertedProducts.push(product);

    // ── Registrar movimiento de stock inicial ──
    if (p.stock > 0) {
      await db.insert(stockMovements).values({
        productId: product.id,
        productName: product.name,
        type: 'inicial',
        quantity: p.stock,
        previousStock: 0,
        newStock: p.stock,
        note: 'Stock inicial al crear el producto',
        createdAt: productCreatedAt,
      });
    }
  }
  console.log(`   ✅ ${insertedProducts.length} productos creados con stock inicial registrado`);

  // ── 4. Precios por producto (variantes de cantidad) ────────────────────
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

  // ── 5. Combos ──────────────────────────────────────────────────────────
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
  const prodMap: Record<string, { id: number; price: number; cost: number }> = {};
  for (const p of insertedProducts) {
    const base = (p.cost || 200) * 2.5;
    prodMap[p.name] = { id: p.id, price: Math.round(base / 50) * 50, cost: p.cost || 200 };
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

  // ── 6. Caja Diaria (Cash Registers) ────────────────────────────────────
  console.log('💰 Creando cajas diarias de ejemplo...');

  const cashRegisterData = [];
  // Crear cajas cerradas para los últimos 7 días hábiles
  for (let day = 7; day >= 1; day--) {
    const openedAt = daysAgoWithHour(day, 8);
    const closedAt = daysAgoWithHour(day, 20);
    const openingAmount = day === 7 ? 10000 : cashRegisterData.length > 0 ? cashRegisterData[cashRegisterData.length - 1].closingAmount : 10000;
    const closingAmount = openingAmount + Math.floor(Math.random() * 5000) + 2000;
    cashRegisterData.push({ openedAt, closedAt, openingAmount, closingAmount, status: 'closed' as const });
  }

  const insertedRegisters = [];
  for (const cr of cashRegisterData) {
    const [reg] = await db.insert(cashRegisters).values({
      openedAt: cr.openedAt,
      closedAt: cr.closedAt,
      openingAmount: cr.openingAmount,
      closingAmount: cr.closingAmount,
      expectedAmount: cr.closingAmount,
      difference: 0,
      status: cr.status,
      note: '',
      createdAt: cr.openedAt,
    }).returning();
    insertedRegisters.push(reg);
  }

  // Crear una caja abierta para hoy
  const lastClosed = cashRegisterData[cashRegisterData.length - 1];
  const [openRegister] = await db.insert(cashRegisters).values({
    openedAt: daysAgoWithHour(0, 8),
    openingAmount: lastClosed.closingAmount,
    status: 'open',
    note: 'Caja del día',
    createdAt: daysAgoWithHour(0, 8),
  }).returning();
  insertedRegisters.push(openRegister);

  console.log(`   ✅ ${insertedRegisters.length} cajas diarias creadas (${cashRegisterData.length} cerradas + 1 abierta)\n`);

  // ── 7. Reposiciones de stock (simuladas) ───────────────────────────────
  console.log('📥 Generando reposiciones de stock...');
  let repoCount = 0;

  const reposiciones = [
    { name: 'Lavandina concentrada', qty: 20, day: 20, note: 'Reposición semanal' },
    { name: 'Detergente concentrado', qty: 30, day: 18, note: 'Pedido proveedor ABC' },
    { name: 'Limpiador de pisos lavanda', qty: 25, day: 15, note: 'Reposición quincenal' },
    { name: 'Jabón líquido para ropa', qty: 15, day: 14, note: 'Reposición semanal' },
    { name: 'Limpiador multiuso', qty: 20, day: 12, note: 'Pedido proveedor XYZ' },
    { name: 'Gel desinfectante WC', qty: 15, day: 10, note: 'Reposición quincenal' },
    { name: 'Lavandina concentrada', qty: 15, day: 8, note: 'Reposición semanal' },
    { name: 'Detergente concentrado', qty: 20, day: 6, note: 'Pedido proveedor ABC' },
    { name: 'Suavizante para ropa', qty: 10, day: 5, note: 'Reposición de emergencia - stock bajo' },
    { name: 'Alcohol en gel', qty: 25, day: 3, note: 'Pedido especial por temporada' },
    { name: 'Limpiador de pisos pino', qty: 15, day: 2, note: 'Reposición semanal' },
    { name: 'Desodorante de pisos cherry', qty: 20, day: 1, note: 'Reposición semanal' },
  ];

  // Track running stock for each product
  const runningStock: Record<number, number> = {};
  for (const p of insertedProducts) {
    runningStock[p.id] = p.stock;
  }

  for (const repo of reposiciones) {
    const prod = prodMap[repo.name];
    if (!prod) continue;
    const prevStock = runningStock[prod.id];
    const newStock = prevStock + repo.qty;
    runningStock[prod.id] = newStock;

    await db.insert(stockMovements).values({
      productId: prod.id,
      productName: repo.name,
      type: 'reposicion',
      quantity: repo.qty,
      previousStock: prevStock,
      newStock: newStock,
      note: repo.note,
      createdAt: daysAgoWithHour(repo.day, 9),
    });

    await db.update(products).set({
      stock: newStock,
      updatedAt: daysAgoWithHour(repo.day, 9),
    }).where(eq(products.id, prod.id));

    repoCount++;
  }
  console.log(`   ✅ ${repoCount} reposiciones de stock registradas`);

  // ── 8. Ventas + Movimientos de stock por venta ─────────────────────────
  console.log('🧾 Generando historial de ventas con movimientos de stock...');

  // Build a map of day → cashRegisterId for linking sales to registers
  const dayToRegisterId: Record<number, number> = {};
  for (let i = 0; i < cashRegisterData.length; i++) {
    dayToRegisterId[7 - i] = insertedRegisters[i].id; // closed registers for days 7..1
  }
  dayToRegisterId[0] = openRegister.id; // today's open register

  const paymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
  let saleCount = 0;
  let stockMoveCount = 0;
  let cashMoveCount = 0;

  for (let day = 30; day >= 0; day--) {
    const salesPerDay = day === 0 ? 2 : Math.floor(Math.random() * 3) + (day % 3 === 0 ? 1 : 0);

    for (let s = 0; s < salesPerDay; s++) {
      const numItems = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...insertedProducts]
        .filter(p => p.active && runningStock[p.id] > 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);

      if (shuffled.length === 0) continue;

      const items = shuffled.map(p => {
        const basePrice = (p.cost || 200) * 2.5;
        const price = Math.round(basePrice / 50) * 50;
        const maxQty = Math.min(3, Math.floor(runningStock[p.id] / 2));
        const quantity = Math.max(1, Math.floor(Math.random() * maxQty) + 1);
        return {
          productId: p.id,
          productName: p.name,
          quantity,
          price,
          size: 2,
          unit: 'unidad',
          total: price * quantity,
        };
      });

      const grandTotal = items.reduce((sum, i) => sum + i.total, 0);
      const saleHour = 8 + Math.floor(Math.random() * 12);
      const dateStr = daysAgoWithHour(day, saleHour);
      const chosenPayment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // Link sale to cash register if one exists for this day
      const registerId = dayToRegisterId[day] ?? undefined;

      const saleValues: Record<string, unknown> = {
        grandTotal,
        paymentMethod: chosenPayment,
        date: dateStr,
        createdAt: dateStr,
      };
      if (registerId) saleValues.cashRegisterId = registerId;

      const [sale] = await db.insert(sales).values(saleValues).returning();

      await db.insert(saleItems).values(
        items.map(i => ({ saleId: sale.id, ...i }))
      );

      // Register cash movement if payment is efectivo and there's a register
      if (chosenPayment === 'efectivo' && registerId) {
        await db.insert(cashMovements).values({
          cashRegisterId: registerId,
          type: 'venta',
          amount: grandTotal,
          description: `Venta #${sale.id}`,
          category: 'venta',
          referenceId: sale.id,
          createdAt: dateStr,
        });
        cashMoveCount++;
      }

      // Registrar movimientos de stock por cada item vendido
      for (const item of items) {
        const stockDecrement = item.quantity * item.size;
        const prevStock = runningStock[item.productId];
        const newStk = Math.max(0, prevStock - stockDecrement);
        runningStock[item.productId] = newStk;

        await db.insert(stockMovements).values({
          productId: item.productId,
          productName: item.productName,
          type: 'venta',
          quantity: -stockDecrement,
          previousStock: prevStock,
          newStock: newStk,
          note: `Venta #${sale.id}`,
          referenceId: sale.id,
          createdAt: dateStr,
        });

        await db.update(products).set({
          stock: newStk,
          updatedAt: dateStr,
        }).where(eq(products.id, item.productId));

        stockMoveCount++;
      }

      saleCount++;
    }
  }
  console.log(`   ✅ ${saleCount} ventas generadas`);
  console.log(`   ✅ ${stockMoveCount} movimientos de stock por ventas registrados`);
  console.log(`   ✅ ${cashMoveCount} movimientos de caja registrados`);

  // ── 9. Ajustes de stock (ejemplos) ─────────────────────────────────────
  console.log('🔧 Registrando ajustes de inventario...');

  const ajustes = [
    { name: 'Limpiador de hornos', qty: -2, day: 7, note: 'Ajuste por rotura de envases' },
    { name: 'Blanqueador óptico', qty: 3, day: 4, note: 'Ajuste: encontrados en depósito trasero' },
  ];

  for (const ajuste of ajustes) {
    const prod = prodMap[ajuste.name];
    if (!prod) continue;
    const prevStock = runningStock[prod.id];
    const newStk = Math.max(0, prevStock + ajuste.qty);
    runningStock[prod.id] = newStk;

    await db.insert(stockMovements).values({
      productId: prod.id,
      productName: ajuste.name,
      type: 'ajuste',
      quantity: ajuste.qty,
      previousStock: prevStock,
      newStock: newStk,
      note: ajuste.note,
      createdAt: daysAgoWithHour(ajuste.day, 14),
    });

    await db.update(products).set({
      stock: newStk,
      updatedAt: daysAgoWithHour(ajuste.day, 14),
    }).where(eq(products.id, prod.id));
  }
  console.log(`   ✅ ${ajustes.length} ajustes de inventario registrados`);

  // ── Resumen final ──────────────────────────────────────────────────────
  const totalMovements = insertedProducts.filter(p => p.stock > 0).length + repoCount + stockMoveCount + ajustes.length;
  console.log('\n🎉 Seed completado exitosamente!');
  console.log(`   📊 Resumen:`);
  console.log(`      - ${insertedCategories.length} categorías`);
  console.log(`      - ${insertedProducts.length} productos`);
  console.log(`      - ${priceCount} precios`);
  console.log(`      - ${comboData.length} combos`);
  console.log(`      - ${insertedRegisters.length} cajas diarias`);
  console.log(`      - ${saleCount} ventas`);
  console.log(`      - ${cashMoveCount} movimientos de caja`);
  console.log(`      - ${totalMovements} movimientos de stock`);
  console.log('   Podés iniciar la app con: npm run dev');
  console.log('   Login con contraseña: 123\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
