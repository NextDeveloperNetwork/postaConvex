'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'sq' | 'en';

interface Dictionary {
  appName: string;
  appSubtitle: string;
  nav: {
    login: string;
    register: string;
    courier: string;
    seller: string;
    office: string;
    finance: string;
    admin: string;
    pending: string;
    switchRole: string;
    logout: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    businessNameLabel: string;
    requestedRoleLabel: string;
    cityLabel: string;
    loginBtn: string;
    registerBtn: string;
    noAccountText: string;
    hasAccountText: string;
    orContinueWith: string;
    quickDemoLogin: string;
  };
  roles: {
    ADMIN: string;
    SELLER: string;
    COURIER: string;
    COURIER_TRANSPORT: string;
    COURIER_DELIVERY: string;
    OFFICE_STAFF: string;
    FINANCE_ADMIN: string;
    PENDING: string;
  };
  statuses: {
    CREATED: string;
    PICKED_UP: string;
    IN_TRANSIT: string;
    AT_DESTINATION: string;
    OUT_FOR_DELIVERY: string;
    DELIVERED_PENDING_SETTLEMENT: string;
    CLOSED: string;
    CANCELLED: string;
  };
  payments: {
    UNPAID: string;
    COD_COLLECTED: string;
    SETTLED: string;
  };
  courierView: {
    title: string;
    pickupTab: string;
    deliveryTab: string;
    pickupAction: string;
    transportAction: string;
    deliverAction: string;
    codAmount: string;
    recipient: string;
    address: string;
    phone: string;
    noTasks: string;
  };
  sellerView: {
    title: string;
    newShipment: string;
    myShipments: string;
    recipientName: string;
    recipientPhone: string;
    destinationCity: string;
    address: string;
    codAmount: string;
    shippingFee: string;
    courierFee: string;
    sellerNet: string;
    createBtn: string;
    pendingBalance: string;
    settledTotal: string;
    totalShipments: string;
    trackingCode: string;
    printLabel: string;
  };
  officeView: {
    title: string;
    scanIntake: string;
    receiveAction: string;
    assignCourier: string;
    selectCourier: string;
    recordPayment: string;
    closeShipment: string;
    cashBalance: string;
    barcodeSearch: string;
  };
  financeView: {
    title: string;
    totalCodCollected: string;
    totalShippingFees: string;
    totalCourierFees: string;
    sellerPendingPayouts: string;
    officeCashBalance: string;
    processSettlement: string;
    settlementSuccess: string;
    ledgerTitle: string;
    type: string;
    amount: string;
    description: string;
    date: string;
  };
  adminView: {
    title: string;
    pendingUsers: string;
    assignRole: string;
    selectOffice: string;
    approveBtn: string;
    activeUsers: string;
    userRole: string;
    office: string;
  };
  pendingView: {
    title: string;
    message: string;
    statusBadge: string;
    contactAdmin: string;
  };
  workflow: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
  };
  common: {
    currency: string;
    search: string;
    status: string;
    actions: string;
    date: string;
    tracking: string;
    details: string;
    success: string;
    error: string;
  };
}

const dictionaries: Record<Language, Dictionary> = {
  sq: {
    appName: 'POSTA Shqiptare Logistics',
    appSubtitle: 'Sistemi Profesional i Dërgesave & Porosive COD',
    nav: {
      login: 'Hyr (Login)',
      register: 'Regjistrohu',
      courier: 'Kuriere',
      seller: 'Shitësi',
      office: 'Zyra',
      finance: 'Financa',
      admin: 'Administrimi',
      pending: 'Në Pritje',
      switchRole: 'Ndrysho Profilin Demo',
      logout: 'Dil nga Logini',
    },
    auth: {
      loginTitle: 'Hyni në Llogarinë POSTA',
      loginSubtitle: 'Zgjidhni mënyrën e hyrjes ose përdorni rolet demo',
      registerTitle: 'Krijo Llogari të Re',
      registerSubtitle: 'Regjistrohuni si Shitës, Kurier ose Staf i Zyrës',
      emailLabel: 'Adresa Email',
      passwordLabel: 'Fjalëkalimi',
      fullNameLabel: 'Emri & Mbiemri',
      businessNameLabel: 'Emri i Biznesit / Dyqanit',
      requestedRoleLabel: 'Roli i Kërkuar',
      cityLabel: 'Qyteti',
      loginBtn: 'Hyr në Llogari',
      registerBtn: 'Dërgo Kërkesën për Regjistrim',
      noAccountText: 'Nuk keni ende llogari?',
      hasAccountText: 'Keni tashmë një llogari?',
      orContinueWith: 'Ose vazhdoni me OAuth',
      quickDemoLogin: 'Hyrje e Shpejtë Demo (Kliko Rolin)',
    },
    roles: {
      ADMIN: 'Administrator',
      SELLER: 'Shitës (Merchant)',
      COURIER: 'Kurier (Përgjithshëm)',
      COURIER_TRANSPORT: 'Kurier Transporti (Tranzit)',
      COURIER_DELIVERY: 'Kurier Dorëzimi (Lokal)',
      OFFICE_STAFF: 'Staf i Zyrës',
      FINANCE_ADMIN: 'Financë & Admin',
      PENDING: 'Në Pritje të Aprovimit',
    },
    statuses: {
      CREATED: 'Krijuar nga Shitësi',
      PICKED_UP: 'Marrë nga Kurieri',
      IN_TRANSIT: 'Në Transport për Zyrën',
      AT_DESTINATION: 'Në Zyrën e Destinacionit',
      OUT_FOR_DELIVERY: 'Në Dorëzim te Klienti',
      DELIVERED_PENDING_SETTLEMENT: 'Porosia u Dorëzua & Paratë u Mblodhën',
      CLOSED: 'Përfunduar & Arka e Mbyllur',
      CANCELLED: 'Anuluar',
    },
    payments: {
      UNPAID: 'Papaguar',
      COD_COLLECTED: 'COD i Mbledhur',
      SETTLED: 'Likuiduar te Shitësi',
    },
    courierView: {
      title: 'Paneli i Kurierit',
      pickupTab: 'Pikapet për Transport',
      deliveryTab: 'Dorëzimet te Klienti (COD)',
      pickupAction: 'Merr Paketën nga Shitësi',
      transportAction: 'Nis Transportin për Zyrën',
      deliverAction: 'Dorëzo & Mblidh Paratë COD',
      codAmount: 'Vlera COD për t\'u mbledhur',
      recipient: 'Marrësi',
      address: 'Adresa',
      phone: 'Telefon',
      noTasks: 'Nuk ka dërgesa aktuale në këtë kategori.',
    },
    sellerView: {
      title: 'Paneli i Shitësit',
      newShipment: 'Krijo Dërgesë të Re',
      myShipments: 'Dërgesat e Mia',
      recipientName: 'Emri i Marrësit',
      recipientPhone: 'Numri i Telefonit',
      destinationCity: 'Qyteti i Destinacionit',
      address: 'Adresa e Plotë',
      codAmount: 'Vlera COD (Para në dorë)',
      shippingFee: 'Tarifa e Transportit',
      courierFee: 'Tarifa e Kurierit',
      sellerNet: 'Nettot i Shitësit (Pasi zbriten tarifat)',
      createBtn: 'Regjistro Dërgesën',
      pendingBalance: 'Bilanci i Papaguar (COD)',
      settledTotal: 'Totali i Likuiduar',
      totalShipments: 'Gjithsej Dërgesa',
      trackingCode: 'Kodi i Gjurmimit',
      printLabel: 'Printo Etiketën / Barkodin',
    },
    officeView: {
      title: 'Paneli i Zyrës së Destinacionit',
      scanIntake: 'Skano Barkodin & Prit Paketa',
      receiveAction: 'Konfirmo Pranimin në Zyrë',
      assignCourier: 'Cakto Kurierin e Dorëzimit',
      selectCourier: 'Zgjidh Kurierin',
      recordPayment: 'Regjistro Cash nga Kurieri',
      closeShipment: 'Mbyll Dërgesën në Arkë',
      cashBalance: 'Bilanci i Arkës së Zyrës',
      barcodeSearch: 'Kërko me Kodi Gjurmimi / Barkod...',
    },
    financeView: {
      title: 'Paneli i Financës & Likuidimeve',
      totalCodCollected: 'Totali i COD të Mbledhur',
      totalShippingFees: 'Arka e Kompanisë (Tarifat)',
      totalCourierFees: 'Pagesat e Kurierëve',
      sellerPendingPayouts: 'Detyrime te Shitësit',
      officeCashBalance: 'Gjendja Cash në Zyra',
      processSettlement: 'Ekzekuto Likuidimin e Shitësve',
      settlementSuccess: 'Likuidimi u krye me sukses!',
      ledgerTitle: 'Regjistri i Transaksioneve Financiare (Ledger)',
      type: 'Tipi',
      amount: 'Vlera',
      description: 'Përshkrimi',
      date: 'Data',
    },
    adminView: {
      title: 'Administrimi i Përdoruesve',
      pendingUsers: 'Përdoruesit e Rinj në Pritje',
      assignRole: 'Cakto Rolin',
      selectOffice: 'Cakto Zyrën',
      approveBtn: 'Aprovo & Aktivizo',
      activeUsers: 'Përdoruesit Aktivë',
      userRole: 'Roli',
      office: 'Zyra',
    },
    pendingView: {
      title: 'Llogaria juaj është në Pritje të Aprovimit',
      message: 'Mirëseerdhët në POSTA Shqiptare. Administratori është duke shqyrtuar regjistrimin tuaj për t\'ju caktuar rolin përkatës (Shitës, Kurier, Staf Zyre).',
      statusBadge: 'Statusi: NË PRITJE',
      contactAdmin: 'Nëse keni nevojë për ndihmë, kontaktoni me financën ose administratorin.',
    },
    workflow: {
      step1: '1. Krijohet dërgesa',
      step2: '2. Pranuar në Zyrë',
      step3: '3. Në Thes (Transport)',
      step4: '4. Zyrë Destinacioni',
      step5: '5. Dorëzuar (Zyra / Kurieri)',
      step6: '6. Mbyllur & Likuiduar',
    },
    common: {
      currency: 'ALL',
      search: 'Kërko...',
      status: 'Statusi',
      actions: 'Veprime',
      date: 'Data',
      tracking: 'Nr. Gjurmimit',
      details: 'Detajet',
      success: 'Sukses',
      error: 'Gabim',
    }
  },
  en: {
    appName: 'POSTA Logistics System',
    appSubtitle: 'Professional Courier & COD Management Platform',
    nav: {
      login: 'Login',
      register: 'Register',
      courier: 'Courier',
      seller: 'Seller',
      office: 'Office',
      finance: 'Finance',
      admin: 'Admin',
      pending: 'Pending',
      switchRole: 'Switch Demo Role',
      logout: 'Logout',
    },
    auth: {
      loginTitle: 'Sign in to POSTA',
      loginSubtitle: 'Choose login method or use quick demo role selector',
      registerTitle: 'Create New Account',
      registerSubtitle: 'Register as Merchant Seller, Courier, or Office Staff',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      fullNameLabel: 'Full Name',
      businessNameLabel: 'Business / Shop Name',
      requestedRoleLabel: 'Requested Role',
      cityLabel: 'City',
      loginBtn: 'Sign In',
      registerBtn: 'Submit Registration Request',
      noAccountText: 'Don\'t have an account yet?',
      hasAccountText: 'Already have an account?',
      orContinueWith: 'Or continue with OAuth',
      quickDemoLogin: 'Quick Demo Access (Click Role)',
    },
    roles: {
      ADMIN: 'Administrator',
      SELLER: 'Seller (Merchant)',
      COURIER: 'Courier (General)',
      COURIER_TRANSPORT: 'Transport Courier (Inter-Office)',
      COURIER_DELIVERY: 'Destination Delivery Courier (Local)',
      OFFICE_STAFF: 'Office Staff',
      FINANCE_ADMIN: 'Finance & Admin',
      PENDING: 'Pending Approval',
    },
    statuses: {
      CREATED: 'Shipment Created',
      PICKED_UP: 'Picked up by Courier',
      IN_TRANSIT: 'In Transit to Office',
      AT_DESTINATION: 'At Destination Office',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED_PENDING_SETTLEMENT: 'Delivered & COD Collected',
      CLOSED: 'Closed & Cash Audited',
      CANCELLED: 'Cancelled',
    },
    payments: {
      UNPAID: 'Unpaid',
      COD_COLLECTED: 'COD Collected',
      SETTLED: 'Settled to Seller',
    },
    courierView: {
      title: 'Courier Dashboard',
      pickupTab: 'Pickups for Transport',
      deliveryTab: 'Deliveries to Customers (COD)',
      pickupAction: 'Pick Up Package from Seller',
      transportAction: 'Transport to Destination Office',
      deliverAction: 'Deliver & Collect COD Cash',
      codAmount: 'COD Amount to Collect',
      recipient: 'Recipient',
      address: 'Address',
      phone: 'Phone',
      noTasks: 'No active shipments in this section.',
    },
    sellerView: {
      title: 'Seller Merchant Hub',
      newShipment: 'Create New Shipment',
      myShipments: 'My Packages',
      recipientName: 'Recipient Name',
      recipientPhone: 'Phone Number',
      destinationCity: 'Destination City',
      address: 'Full Delivery Address',
      codAmount: 'COD Amount (Cash on Delivery)',
      shippingFee: 'Shipping Fee',
      courierFee: 'Courier Fee',
      sellerNet: 'Seller Net Payout (COD - Fees)',
      createBtn: 'Register Shipment',
      pendingBalance: 'Pending Balance (Unsettled COD)',
      settledTotal: 'Total Settled Payouts',
      totalShipments: 'Total Packages',
      trackingCode: 'Tracking Code',
      printLabel: 'Print Label / Barcode',
    },
    officeView: {
      title: 'Destination Office Hub',
      scanIntake: 'Scan Barcode & Package Intake',
      receiveAction: 'Confirm Intake at Office',
      assignCourier: 'Assign Delivery Courier',
      selectCourier: 'Select Courier',
      recordPayment: 'Record Cash from Courier',
      closeShipment: 'Close & Audit Shipment Cash',
      cashBalance: 'Office Cash Register',
      barcodeSearch: 'Search by Tracking Number / Barcode...',
    },
    financeView: {
      title: 'Finance & Payouts System',
      totalCodCollected: 'Total COD Cash Collected',
      totalShippingFees: 'Shipping Revenue',
      totalCourierFees: 'Courier Fees Paid',
      sellerPendingPayouts: 'Pending Seller Liabilities',
      officeCashBalance: 'Cash Held in Branch Offices',
      processSettlement: 'Process Seller Settlements',
      settlementSuccess: 'Seller payouts settled successfully!',
      ledgerTitle: 'Financial Transaction Ledger',
      type: 'Type',
      amount: 'Amount',
      description: 'Description',
      date: 'Date',
    },
    adminView: {
      title: 'User Administration',
      pendingUsers: 'New Pending Registration Queue',
      assignRole: 'Assign Role',
      selectOffice: 'Assign Office',
      approveBtn: 'Approve & Activate User',
      activeUsers: 'Active System Users',
      userRole: 'Role',
      office: 'Office',
    },
    pendingView: {
      title: 'Your Account is Pending Admin Approval',
      message: 'Welcome to POSTA. An administrator is currently reviewing your registration to assign your operational role (Seller, Courier, Office Staff).',
      statusBadge: 'Status: PENDING',
      contactAdmin: 'For urgent access, please contact system administration.',
    },
    workflow: {
      step1: '1. Shipment Created',
      step2: '2. Received at Office',
      step3: '3. In Bag (Transit)',
      step4: '4. Destination Office',
      step5: '5. Delivered (Office / Courier)',
      step6: '6. Closed & Settled',
    },
    common: {
      currency: 'ALL',
      search: 'Search...',
      status: 'Status',
      actions: 'Actions',
      date: 'Date',
      tracking: 'Tracking No.',
      details: 'Details',
      success: 'Success',
      error: 'Error',
    }
  }
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
  formatALL: (amount: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('sq'); // Default language Albanian

  useEffect(() => {
    const saved = localStorage.getItem('posta_lang') as Language;
    if (saved && (saved === 'sq' || saved === 'en')) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('posta_lang', newLang);
  };

  // Deterministic currency formatter to eliminate server/client React Hydration mismatches
  const formatALL = (amount: number): string => {
    const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} ALL`;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: dictionaries[lang], formatALL }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
