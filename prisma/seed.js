import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Helper untuk membaca file JSON di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔄 Memulai proses seeding data toko...');

  // 1. Baca file JSON kamu
  const jsonPath = path.join(__dirname, 'data_toko.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const rawStores = JSON.parse(rawData);

  console.log(`📦 Terdeteksi ${rawStores.length} data pada file JSON.`);

  // 2. Mapping & Validasi Data agar pas dengan Skema Prisma kamu
  const formattedStores = rawStores.map((item) => {
    return {
      // Pastikan field wajib string atau disesuaikan
      query: item.query || 'toko kosmetik bandar lampung',
      name: item.name,
      nameForEmails: item.name_for_emails || item.name,
      subtypes: item.subtypes || null,
      category: item.category || 'Cosmetics Store',
      type: item.type || 'Store',
      phone: item.phone || null,
      website: item.website || null,
      address: item.address,
      street: item.street || null,
      city: item.city || 'Bandar Lampung',
      county: item.county || null,
      state: item.state || 'Lampung',
      stateCode: item.state_code || null,
      
      // Mengubah ke Integer jika ada di JSON, pastikan aman
      postalCode: item.postal_code ? parseInt(item.postal_code) : null,
      
      country: item.country || 'Indonesia',
      countryCode: item.country_code || 'ID',
      
      // Koordinat wajib diubah ke Float (Angka desimal)
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
      
      h3: item.h3 || null,
      timeZone: item.time_zone || 'Asia/Jakarta',
      plusCode: item.plus_code || null,
      
      // Jika di JSON berupa string/angka, paksa jadi Boolean
      areaService: Boolean(item.area_service),
      
      rating: item.rating ? parseFloat(item.rating) : null,
      reviews: item.reviews ? parseInt(item.reviews) : 0,
      reviewsLink: item.reviews_link || null,
      
      // Field JSON di Prisma harus berupa objek objek murni / stringified JSON yang valid
      reviewsTags: item.reviews_tags || null,
      reviewsPerScore: item.reviews_per_score || {},
      
      reviewsPerScore1: parseInt(item.reviews_per_score_1 || item.reviews_per_score?.['1'] || 0),
      reviewsPerScore2: parseInt(item.reviews_per_score_2 || item.reviews_per_score?.['2'] || 0),
      reviewsPerScore3: parseInt(item.reviews_per_score_3 || item.reviews_per_score?.['3'] || 0),
      reviewsPerScore4: parseInt(item.reviews_per_score_4 || item.reviews_per_score?.['4'] || 0),
      reviewsPerScore5: parseInt(item.reviews_per_score_5 || item.reviews_per_score?.['5'] || 0),
      
      photosCount: parseInt(item.photos_count || 0),
      photo: item.photo || null,
      streetView: item.street_view || null,
      logo: item.logo || null,
      locatedIn: item.located_in || null,
      locatedGoogleId: item.located_google_id || null,
      businessStatus: item.business_status || 'OPERATIONAL',
      
      workingHours: item.working_hours || {},
      workingHoursCsvCompatible: item.working_hours_csv_compatible || null,
      otherHours: item.other_hours || null,
      popularTimes: item.popular_times || null,
      typicalTimeSpent: item.typical_time_spent || null,
      range: item.range || null,
      prices: item.prices || null,
      reservationLinks: item.reservation_links || null,
      bookingAppointmentLink: item.booking_appointment_link || null,
      menuLink: item.menuLink || null,
      orderLinks: item.order_links || null,
      about: item.about || null,
      description: item.description || null,
      posts: item.posts || null,
      verified: Boolean(item.verified),
      
      ownerId: item.owner_id ? String(item.owner_id) : null,
      ownerTitle: item.owner_title || null,
      ownerLink: item.owner_link || null,
      locationLink: item.location_link || null,
      locationReviewsLink: item.location_reviews_link || null,
      
      // ID Unik Google
      placeId: item.place_id,
      googleId: item.google_id,
      cid: item.cid ? String(item.cid) : null,
      kgmid: item.kgmid || null,
      reviewsId: item.reviews_id ? String(item.reviews_id) : null,
    };
  });

  // 3. Eksekusi ke MySQL menggunakan createMany (sangat cepat untuk 500 data)
  // skipDuplicates digunakan agar jika script di-run 2 kali, data yang ID-nya sama tidak bikin eror
  const result = await prisma.dataToko.createMany({
    data: formattedStores,
    skipDuplicates: true, 
  });

  console.log(`✅ Seeding Selesai! Berhasil memasukkan ${result.count} data toko baru ke database.`);
}

main()
  .catch((e) => {
    console.error('❌ Terjadi eror saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });