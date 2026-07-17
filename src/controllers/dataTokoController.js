import prisma from '../config/database.js';

// ==========================================
// 1. GET ALL TOKO (Untuk Sidebar & Map PIN)
// ==========================================
export const getAllToko = async (req, res) => {
  try {
    const { q, city, category, rating, limit, page } = req.query;

    // Build filter dinamis sesuai pencarian user
    let where = {};

    // Jika user mencari teks tertentu (di kolom search)
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { address: { contains: q } },
        { query: { contains: q } }
      ];
    }

    if (city) {
      where.city = city;
    }

    
    if (category) {
      where.category = category;
    }

  
    if (rating) {
      where.rating = {
        gte: parseFloat(rating)
      };
    }

  
    const take = limit ? parseInt(limit) : 50;
    const skip = page ? (parseInt(page) - 1) * take : 0;

    // Ambil data dari tabel dataToko
    const tokoList = await prisma.dataToko.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        rating: true,
        reviews: true,
        latitude: true,
        longitude: true,
        photo: true,
        category: true,
        phone: true,
        businessStatus: true
      },
      orderBy: [
        { reviews: 'desc' },
        { rating: 'desc' }
      ],
      take,
      skip
    });


    const total = await prisma.dataToko.count({ where });

    res.json({
      success: true,
      data: tokoList,
      pagination: {
        total,
        limit: take,
        page: page ? parseInt(page) : 1,
        totalPages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    console.error('Error getAllToko:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data toko',
      error: error.message
    });
  }
};


export const getTokoById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari toko secara spesifik beserta field detail JSON-nya (jam kerja, fasilitas, dll)
    const toko = await prisma.dataToko.findUnique({
      where: { id }
    });

    if (!toko) {
      return res.status(404).json({
        success: false,
        message: 'Data toko tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: toko
    });

  } catch (error) {
    console.error('Error getTokoById:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail data toko',
      error: error.message
    });
  }
};




export const createToko = async (req, res) => {
  try {

    const body = req.body;

    // Validasi field wajib
    if (!body.name || !body.address || !body.latitude || !body.longitude || !body.placeId || !body.googleId) {
      return res.status(400).json({
        success: false,
        message: 'Field utama (Nama, Alamat, Koordinat, Place ID, Google ID) wajib diisi'
      });
    }

    const newToko = await prisma.dataToko.create({
      data: {
        query: body.query || 'manual_input',
        name: body.name,
        nameForEmails: body.nameForEmails || body.name,
        subtypes: body.subtypes || null,
        category: body.category || 'Store',
        type: body.type || 'Store',
        phone: body.phone || null,
        website: body.website || null,
        address: body.address,
        street: body.street || null,
        city: body.city || 'Bandar Lampung',
        state: body.state || 'Lampung',
        country: body.country || 'Indonesia',
        countryCode: body.countryCode || 'ID',
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        timeZone: body.timeZone || 'Asia/Jakarta',
        areaService: body.areaService ?? false,
        rating: body.rating ? parseFloat(body.rating) : null,
        reviews: body.reviews ? parseInt(body.reviews) : 0,
        reviewsPerScore: body.reviewsPerScore || {},
        businessStatus: body.businessStatus || 'OPERATIONAL',
        workingHours: body.workingHours || {},
        placeId: body.placeId,
        googleId: body.googleId,
        cid: body.cid ? String(body.cid) : null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Data toko berhasil ditambahkan',
      data: newToko
    });

  } catch (error) {
    console.error('Error createToko:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data toko',
      error: error.message
    });
  }
};




export const deleteToko = async (req, res) => {
  try {
    const { id } = req.params;

    const existingToko = await prisma.dataToko.findUnique({
      where: { id }
    });

    if (!existingToko) {
      return res.status(404).json({
        success: false,
        message: 'Data toko tidak ditemukan'
      });
    }

    await prisma.dataToko.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Data toko berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleteToko:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data toko',
      error: error.message
    });
  }
};



export const getTokoStats = async (req, res) => {
  try {
    const totalToko = await prisma.dataToko.count();
    
    // Hitung toko yang terverifikasi Google
    const terverifikasi = await prisma.dataToko.count({
      where: { verified: true }
    });

    // Hitung rata-rata rating dari 500 toko kamu
    const aggregations = await prisma.dataToko.aggregate({
      _avg: {
        rating: true
      },
      _sum: {
        reviews: true
      }
    });

    // Kelompokkan jumlah toko berdasarkan kategori terpopuler
    const kategoriPopuler = await prisma.dataToko.groupBy({
      by: ['category'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        total_toko: totalToko,
        terverifikasi: terverifikasi,
        rata_rata_rating: aggregations._avg.rating ? aggregations._avg.rating.toFixed(2) : 0,
        total_seluruh_ulasan: aggregations._sum.reviews || 0,
        top_kategori: kategoriPopuler
      }
    });

  } catch (error) {
    console.error('Error getTokoStats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat statistik toko',
      error: error.message
    });
  }
};