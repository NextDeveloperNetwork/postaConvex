'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Shipment,
  User,
  Office,
  City,
  FinanceLedgerEntry,
  Bag,
  BagStatus,
  BagType,
  ShipmentStatus,
  UserRole,
  OfficeCashHandover,
  HandoverStatus,
  SellerPayoutProof
} from './types';

// ─── Helper ──────────────────────────────────────────────────────────────────
async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json();
  return data;
}

// ─── Context type ─────────────────────────────────────────────────────────────
interface AppStateContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  offices: Office[];
  cities: City[];
  shipments: Shipment[];
  ledgers: FinanceLedgerEntry[];
  bags: Bag[];
  handovers: OfficeCashHandover[];
  payoutBatches: import('./types').PayoutDispatchBatch[];
  payoutProofs: SellerPayoutProof[];
  isLoading: boolean;
  syncFromDB: () => Promise<void>;

  // Workflow actions
  createShipment: (data: {
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
    destinationAddress: string;
    destinationCity: string;
    originOfficeId?: string;
    destinationOfficeId?: string;
    codAmount: number;
    packageType?: 'COD' | 'PREPAID';
    deliveryMode?: 'DOOR_DELIVERY' | 'OFFICE_PICKUP';
    sellerId?: string;
    initialStatus?: ShipmentStatus;
  }) => Promise<Shipment | null>;

  cancelShipment: (shipmentId: string, reason?: string) => Promise<void>;
  deleteShipment: (shipmentId: string) => Promise<void>;
  pickupShipment: (shipmentId: string, courierId?: string) => Promise<void>;
  transportShipment: (shipmentId: string) => Promise<void>;
  receiveShipmentAtOffice: (shipmentId: string) => Promise<void>;
  assignDeliveryCourier: (shipmentId: string, courierId: string) => Promise<void>;

  // Bag actions
  createBag: (shipmentIds: string[], courierId: string, bagType?: BagType, destinationOfficeId?: string) => Promise<Bag | null>;
  approveBag: (bagId: string) => Promise<void>;
  rejectBag: (bagId: string, notes?: string) => Promise<void>;
  completeBag: (bagId: string) => Promise<void>;
  receiveBagAtOffice: (bagId: string) => Promise<void>;

  deliverShipmentAndCollectCOD: (shipmentId: string) => Promise<void>;
  closeAndAuditShipment: (shipmentId: string) => Promise<void>;
  processSellerSettlements: () => Promise<number>;

  // Daily Office Cash Handover actions
  submitOfficeDailyHandover: (officeId: string, amount: number, shipmentCount: number, notes?: string) => Promise<void>;
  submitOfficeDailyHandoverWithCourier: (officeId: string, amount: number, courierId: string, courierName: string, shipmentCount: number, notes?: string) => Promise<void>;
  approveOfficeDailyHandover: (handoverId: string) => Promise<void>;
  approveCashHandoverByCourier: (handoverId: string, signature?: string) => Promise<void>;
  rejectCashHandoverByCourier: (handoverId: string, reason?: string) => Promise<void>;
  receiveOfficeHandoverInFinance: (handoverId: string) => Promise<void>;
  rejectOfficeHandoverInFinance: (handoverId: string, notes?: string) => Promise<void>;

  // Payout Dispatch Batches & Seller Proofs
  createPayoutDispatchBatch: (officeId: string, courierId: string, courierName: string, sellerPayouts: import('./types').SellerPayoutItem[], adminProfit: number, officeCommission: number) => Promise<void>;
  approvePayoutBatchByCourier: (batchId: string, signature?: string) => Promise<void>;
  rejectPayoutBatchByCourier: (batchId: string, reason?: string) => Promise<void>;
  receivePayoutBatchAtOffice: (batchId: string) => Promise<void>;
  rejectPayoutBatchFromOffice: (batchId: string, notes?: string) => Promise<void>;
  completeSellerPayoutFromOffice: (shipmentId: string) => Promise<void>;
  completeSellerPayoutWithProof: (payload: {
    shipmentId: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER';
    recipientName: string;
    recipientIdCard?: string;
    signatureUrl?: string;
    verificationCode?: string;
    bankReference?: string;
    notes?: string;
  }) => Promise<SellerPayoutProof | null>;

  // Admin User actions
  registerUser: (userData: { name: string; email: string; role?: UserRole }) => Promise<User | null>;
  approveUserRole: (userId: string, role: UserRole, officeId?: string) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Admin Office actions
  addOffice: (data: { name: string; city: string; cashBalance: number; intakePercentage?: number }) => Promise<void>;
  updateOffice: (officeId: string, data: Partial<Office>) => Promise<void>;
  toggleOfficeStatus: (officeId: string) => Promise<void>;
  deleteOffice: (officeId: string) => Promise<void>;

  // Admin City actions
  addCity: (data: { name: string; officeId?: string | null }) => Promise<City | null>;
  updateCity: (cityId: string, data: { name?: string; officeId?: string | null }) => Promise<void>;
  deleteCity: (cityId: string) => Promise<void>;

  // Helpers
  getShipmentByTracking: (code: string) => Shipment | undefined;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [ledgers, setLedgers] = useState<FinanceLedgerEntry[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [handovers, setHandovers] = useState<OfficeCashHandover[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<import('./types').PayoutDispatchBatch[]>([]);
  const [payoutProofs, setPayoutProofs] = useState<SellerPayoutProof[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize state strictly from DB on mount & clear stale browser localStorage items
  useEffect(() => {
    try {
      localStorage.removeItem('posta_office_handovers');
      localStorage.removeItem('posta_payout_batches');
    } catch (err) {}
    syncFromDB();
  }, []);

  // Restore logged-in user from localStorage after mount (prevents SSR hydration mismatch)
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('posta_current_user');
      if (saved) {
        setCurrentUserState(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem('posta_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('posta_current_user');
      }
    } catch {}
  };

  // ─── Initial sync from Neon DB ─────────────────────────────────────────────
  const syncFromDB = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/sync');
      if (data.success) {
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          setCurrentUserState(prev => {
            if (prev) {
              const updated = data.users.find((u: User) => u.id === prev.id || u.email === prev.email);
              if (updated) {
                try { localStorage.setItem('posta_current_user', JSON.stringify(updated)); } catch {}
                return updated;
              }
              return prev;
            }
            // Auto-select Admin if no user is saved in localStorage so the developer/user is never blocked
            const defaultUser = data.users.find((u: User) => u.role === 'ADMIN') || data.users[0];
            if (defaultUser) {
              try { localStorage.setItem('posta_current_user', JSON.stringify(defaultUser)); } catch {}
              return defaultUser;
            }
            return null;
          });
        }
        if (data.offices) setOffices(data.offices);
        if (data.cities) setCities(data.cities);
        if (data.shipments) setShipments(data.shipments);
        if (data.ledgers) setLedgers(data.ledgers);
        if (data.bags) setBags(data.bags);
        if (data.handovers) setHandovers(data.handovers);
        if (data.payoutBatches) setPayoutBatches(data.payoutBatches);
        if (data.payoutProofs) setPayoutProofs(data.payoutProofs);
      }
    } catch (err) {
      console.error('Error syncing state from DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 1. Create Shipment ────────────────────────────────────────────────────
  const createShipment = async (data: {
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
    destinationAddress: string;
    destinationCity: string;
    originOfficeId?: string;
    destinationOfficeId?: string;
    codAmount: number;
    packageType?: 'COD' | 'PREPAID';
    deliveryMode?: 'DOOR_DELIVERY' | 'OFFICE_PICKUP';
    sellerId?: string;
    initialStatus?: ShipmentStatus;
  }): Promise<Shipment | null> => {
    const randomCode = 'AL-' + Math.floor(100000 + Math.random() * 900000);

    // Resolve destination office
    let destinationOffice = offices.find(o => o.id === data.destinationOfficeId);
    if (!destinationOffice) {
      destinationOffice = offices.find(o => o.city.toLowerCase() === data.destinationCity.toLowerCase())
        || offices[1]
        || offices[0];
    }

    // Resolve origin office
    let originOffice = offices.find(o => o.id === data.originOfficeId);
    if (!originOffice) {
      originOffice = offices.find(o => o.id === currentUser?.officeId) || offices[0];
    }

    if (!originOffice || !destinationOffice) {
      console.error('Cannot create shipment: no offices available');
      return null;
    }

    const isPrepaid = data.packageType === 'PREPAID' || data.codAmount === 0;
    const finalCodAmount = isPrepaid ? 0 : data.codAmount;
    const shippingFee = 300; // Admin set total tariff
    const courierFee = 0; // Included in the 300 ALL total tariff
    const sellerNet = isPrepaid ? 0 : Math.max(0, finalCodAmount - shippingFee);

    // Resolve seller identity (null for walk-in, actual user id for sellers)
    let activeSellerId: string | null = null;
    let activeSellerName = data.senderName;

    if (data.sellerId && data.sellerId !== 'walk-in') {
      activeSellerId = data.sellerId;
    } else if (currentUser?.role === 'SELLER') {
      activeSellerId = currentUser.id;
      activeSellerName = currentUser.name;
    }

    const startStatus = data.initialStatus || 'CREATED';

    const payload = {
      trackingNumber: randomCode,
      barcode: `*${randomCode}*`,
      senderName: activeSellerName || 'Klient në Zyrë',
      senderPhone: data.senderPhone || '+355 69 123 4567',
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      destinationAddress: data.destinationAddress,
      destinationCity: data.destinationCity,
      packageType: isPrepaid ? 'PREPAID' : 'COD',
      deliveryMode: data.deliveryMode || 'DOOR_DELIVERY',
      shippingFeePaidBySender: isPrepaid,
      codAmount: finalCodAmount,
      shippingFee,
      courierFee,
      sellerNet,
      status: startStatus,
      paymentStatus: isPrepaid ? 'COD_COLLECTED' : 'UNPAID',
      originOfficeId: originOffice.id,
      originOfficeName: originOffice.name,
      destinationOfficeId: destinationOffice.id,
      destinationOfficeName: destinationOffice.name,
      sellerId: activeSellerId,
      sellerName: activeSellerName || 'Klient në Zyrë',
      logs: [
        {
          status: startStatus,
          location: startStatus === 'AT_DESTINATION' ? destinationOffice.city : originOffice.city,
          notes: startStatus === 'AT_DESTINATION'
            ? 'Dërgesa u regjistrua direkt te Zyra e Destinacionit (At Destination)'
            : isPrepaid
            ? 'Dërgesë Jo COD (Parapaguar) e regjistruar.'
            : 'Dërgesa COD u regjistrua me sukses në sistem.',
          createdBy: activeSellerName || 'Zyra Postare',
        }
      ]
    };

    try {
      const resData = await apiFetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resData.success && resData.shipment) {
        const newShipment = resData.shipment as Shipment;
        setShipments(prev => [newShipment, ...prev]);

        // If prepaid, update origin office cash balance in DB
        if (isPrepaid) {
          await apiFetch(`/api/offices/${originOffice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cashBalance: (originOffice.cashBalance || 0) + shippingFee }),
          });
          await apiFetch('/api/ledgers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shipmentId: newShipment.id,
              trackingNumber: newShipment.trackingNumber,
              officeId: originOffice.id,
              officeName: originOffice.name,
              type: 'SHIPPING_FEE',
              amount: shippingFee,
              description: `Tarifa postare (${shippingFee} ALL) mbledhur nga dërguesi për pakon e parapaguar ${newShipment.trackingNumber}`,
            }),
          });
          await syncFromDB();
        }

        return newShipment;
      } else {
        console.error('Database insertion error:', resData.error);
        return null;
      }
    } catch (err) {
      console.error('API Post shipment error:', err);
      return null;
    }
  };

  // ─── 1b. Cancel Shipment ───────────────────────────────────────────────────
  const cancelShipment = async (shipmentId: string, reason?: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          log: {
            status: 'CANCELLED',
            notes: reason || `Dërgesa u anullua nga ${currentUser?.name || 'Shitësi'} para nisjes.`,
            location: shipment.originOfficeName || 'Zyra',
            createdBy: currentUser?.name || 'System',
          }
        }),
      });
      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));
      }
    } catch (err) {
      console.error('Error cancelling shipment:', err);
    }
  };

  // ─── 1c. Delete Shipment ───────────────────────────────────────────────────
  const deleteShipment = async (shipmentId: string) => {
    try {
      await apiFetch(`/api/shipments/${shipmentId}`, { method: 'DELETE' });
      setShipments(prev => prev.filter(s => s.id !== shipmentId));
    } catch (err) {
      console.error('Error deleting shipment:', err);
    }
  };

  // ─── 2. Pickup Shipment / Office Intake ───────────────────────────────────
  const pickupShipment = async (shipmentId: string, courierId?: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    const courier = courierId ? users.find(u => u.id === courierId) : currentUser;
    const isPrepaid = shipment.packageType === 'PREPAID' || shipment.shippingFeePaidBySender;

    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PICKED_UP',
          courierId: courier?.id || null,
          courierName: courier?.name || null,
          log: {
            status: 'PICKED_UP',
            location: shipment.originOfficeName,
            notes: isPrepaid
              ? `Pranuar në zyrë. U arkëtua tarifa postare (${shipment.shippingFee} ALL) nga dërguesi.`
              : `Marrë në dorëzim nga ${courier?.name || 'Zyra Postare'}`,
            createdBy: courier?.name || currentUser?.name || 'System',
          }
        }),
      });
      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));
      }
    } catch (err) {
      console.error('Error updating pickup status:', err);
    }
  };

  // ─── 3. Transport Shipment ─────────────────────────────────────────────────
  const transportShipment = async (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_TRANSIT',
          log: {
            status: 'IN_TRANSIT',
            location: 'Autostradë / Rrugë',
            notes: `Nisur për në zyrën e destinacionit (${shipment.destinationOfficeName})`,
            createdBy: currentUser?.name || 'System',
          }
        }),
      });
      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));
      }
    } catch (err) {
      console.error('Error updating transport status:', err);
    }
  };

  // ─── 4. Receive at Destination Office ─────────────────────────────────────
  const receiveShipmentAtOffice = async (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'AT_DESTINATION',
          log: {
            status: 'AT_DESTINATION',
            location: shipment.destinationOfficeName,
            notes: 'Pranuar dhe skanuar në Zyrën e Destinacionit.',
            createdBy: currentUser?.name || 'System',
          }
        }),
      });
      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));
      }
    } catch (err) {
      console.error('Error receiving shipment at office:', err);
    }
  };

  // ─── 5. Assign Delivery Courier ────────────────────────────────────────────
  const assignDeliveryCourier = async (shipmentId: string, courierId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    const courier = users.find(u => u.id === courierId);
    if (!shipment || !courier) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'OUT_FOR_DELIVERY',
          courierId: courier.id,
          courierName: courier.name,
          log: {
            status: 'OUT_FOR_DELIVERY',
            location: shipment.destinationOfficeName,
            notes: `Caktuar te kurieri lokal i dorëzimit: ${courier.name}`,
            createdBy: currentUser?.name || 'System',
          }
        }),
      });
      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));
      }
    } catch (err) {
      console.error('Error assigning delivery courier:', err);
    }
  };

  // ─── 5b. Create Bag ────────────────────────────────────────────────────────
  const createBag = async (
    shipmentIds: string[],
    courierId: string,
    bagType: BagType = 'DELIVERY',
    destinationOfficeId?: string
  ): Promise<Bag | null> => {
    const courier = users.find(u => u.id === courierId);
    const office = offices.find(o => o.id === currentUser?.officeId) || offices[0];
    const destOffice = destinationOfficeId ? offices.find(o => o.id === destinationOfficeId) : undefined;

    if (!office) return null;

    try {
      const res = await apiFetch('/api/bags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId,
          courierName: courier?.name || 'Kurier',
          officeId: office.id,
          officeName: office.name,
          destinationOfficeId: destOffice?.id || null,
          destinationOfficeName: destOffice?.name || null,
          bagType,
          shipmentIds,
        }),
      });

      if (res.success && res.bag) {
        setBags(prev => [res.bag, ...prev]);
        return res.bag as Bag;
      }
      return null;
    } catch (err) {
      console.error('Error creating bag:', err);
      return null;
    }
  };

  // ─── 5c. Approve Bag ───────────────────────────────────────────────────────
  const approveBag = async (bagId: string) => {
    const bag = bags.find(b => b.id === bagId);
    if (!bag) return;
    const courier = users.find(u => u.id === bag.courierId);
    const newShipmentStatus: ShipmentStatus = bag.bagType === 'TRANSIT' ? 'IN_TRANSIT' : 'OUT_FOR_DELIVERY';
    const now = new Date().toISOString();

    try {
      // Update all shipments in the bag
      await Promise.all(
        bag.shipmentIds.map(sid => {
          const s = shipments.find(sh => sh.id === sid);
          return apiFetch(`/api/shipments/${sid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: newShipmentStatus,
              courierId: courier?.id || null,
              courierName: courier?.name || null,
              log: {
                status: newShipmentStatus,
                location: s?.originOfficeName || '',
                notes: bag.bagType === 'TRANSIT'
                  ? `Thesi i tranzitit për në zyrën ${bag.destinationOfficeName || 'destinacion'} u aprovua nga kurieri ${courier?.name || 'Kurier'}. Në udhëtim.`
                  : `Thesi i dorëzimit u aprovua nga kurieri ${courier?.name || 'Kurier'}. Në dërgim te klientët.`,
                createdBy: courier?.name || currentUser?.name || 'System',
              }
            }),
          });
        })
      );

      // Update bag status
      const bagStatus: BagStatus = bag.bagType === 'TRANSIT' ? 'IN_TRANSIT' : 'APPROVED';
      const res = await apiFetch(`/api/bags/${bagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bagStatus, approvedAt: now }),
      });

      if (res.success) {
        await syncFromDB();
      }
    } catch (err) {
      console.error('Error approving bag:', err);
    }
  };

  // ─── 5d. Reject Bag ────────────────────────────────────────────────────────
  const rejectBag = async (bagId: string, notes?: string) => {
    const bag = bags.find(b => b.id === bagId);
    if (!bag) return;

    try {
      await Promise.all(
        bag.shipmentIds.map(sid => {
          const s = shipments.find(sh => sh.id === sid);
          return apiFetch(`/api/shipments/${sid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'PICKED_UP',
              log: {
                status: 'PICKED_UP',
                location: s?.originOfficeName || '',
                notes: notes || 'Thesi u refuzua nga kurieri. Pakoja kthehet në radhë.',
                createdBy: currentUser?.name || 'System',
              }
            }),
          });
        })
      );

      const res = await apiFetch(`/api/bags/${bagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', notes: notes || 'Refuzuar' }),
      });

      if (res.success) {
        await syncFromDB();
      }
    } catch (err) {
      console.error('Error rejecting bag:', err);
    }
  };

  // ─── 5e. Complete Bag ──────────────────────────────────────────────────────
  const completeBag = async (bagId: string) => {
    try {
      const res = await apiFetch(`/api/bags/${bagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.success && res.bag) {
        setBags(prev => prev.map(b => b.id === bagId ? res.bag : b));
      }
    } catch (err) {
      console.error('Error completing bag:', err);
    }
  };

  // ─── 5f. Receive Bag at Office ─────────────────────────────────────────────
  const receiveBagAtOffice = async (bagId: string) => {
    const bag = bags.find(b => b.id === bagId);
    if (!bag) return;
    const office = offices.find(o => o.id === currentUser?.officeId) || offices[0];

    try {
      // Update all shipments to AT_DESTINATION at the receiving office
      await Promise.all(
        bag.shipmentIds.map(sid =>
          apiFetch(`/api/shipments/${sid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'AT_DESTINATION',
              destinationOfficeId: office.id,
              destinationOfficeName: office.name,
              log: {
                status: 'AT_DESTINATION',
                location: office.name,
                notes: `Thesi ${bagId} u pranua te sporteli. Pakot u shkarkuan në zyrën ${office.name}.`,
                createdBy: currentUser?.name || 'System',
              }
            }),
          })
        )
      );

      const res = await apiFetch(`/api/bags/${bagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (res.success) {
        await syncFromDB();
      }
    } catch (err) {
      console.error('Error receiving bag at office:', err);
    }
  };

  // ─── 6. Deliver Shipment & Collect COD ────────────────────────────────────
  const deliverShipmentAndCollectCOD = async (shipmentId: string) => {
    const targetShipment = shipments.find(s => s.id === shipmentId);
    if (!targetShipment) return;

    const originOffice = offices.find(o => o.id === targetShipment.originOfficeId);
    const destOffice = offices.find(o => o.id === targetShipment.destinationOfficeId);

    const originInterest = originOffice?.intakePercentage
      ? Math.round(targetShipment.shippingFee * (originOffice.intakePercentage / 100))
      : 100;
    const destInterest = 100;

    try {
      // 1. Update shipment status
      const shipRes = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED_PENDING_SETTLEMENT',
          paymentStatus: 'COD_COLLECTED',
          log: {
            status: 'DELIVERED_PENDING_SETTLEMENT',
            location: targetShipment.destinationAddress,
            notes: `Dorëzuar te klienti (${targetShipment.recipientName}). Paratë COD (${targetShipment.codAmount} ALL) u mblodhën me sukses.`,
            createdBy: currentUser?.name || 'System',
          }
        }),
      });
      if (shipRes.success && shipRes.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? shipRes.shipment : s));
      }

      // 2. Create ledger entries (prevent duplicate tariff logging if already logged at creation)
      const alreadyHasTariff = ledgers.some(l => l.shipmentId === targetShipment.id && (l.type === 'POSTAL_TARIFF' || l.type === 'SHIPPING_FEE'));

      const ledgerPayload = [
        {
          shipmentId: targetShipment.id,
          trackingNumber: targetShipment.trackingNumber,
          officeId: targetShipment.destinationOfficeId,
          officeName: targetShipment.destinationOfficeName,
          sellerId: targetShipment.sellerId,
          sellerName: targetShipment.sellerName,
          type: 'COD_COLLECTION',
          amount: targetShipment.codAmount,
          description: `Arkëtim Cash COD për ${targetShipment.trackingNumber} (${targetShipment.recipientName})`,
        },
        ...(!alreadyHasTariff ? [{
          shipmentId: targetShipment.id,
          trackingNumber: targetShipment.trackingNumber,
          officeId: offices[0]?.id || null,
          officeName: offices[0]?.name || 'Zyra Qendrore Financiare',
          sellerId: targetShipment.sellerId,
          sellerName: targetShipment.sellerName,
          type: 'POSTAL_TARIFF',
          amount: targetShipment.shippingFee,
          description: `Tarifë e shërbimit postar në Financë për ${targetShipment.trackingNumber}`,
        }] : []),
        {
          shipmentId: targetShipment.id,
          trackingNumber: targetShipment.trackingNumber,
          officeId: targetShipment.originOfficeId,
          officeName: targetShipment.originOfficeName,
          sellerId: null,
          sellerName: null,
          type: 'OFFICE_INTEREST_ORIGIN',
          amount: originInterest,
          description: `Interesi i Zyrës së Origjinës për pranim (${targetShipment.trackingNumber})`,
        },
        {
          shipmentId: targetShipment.id,
          trackingNumber: targetShipment.trackingNumber,
          officeId: targetShipment.destinationOfficeId,
          officeName: targetShipment.destinationOfficeName,
          sellerId: null,
          sellerName: null,
          type: 'OFFICE_INTEREST_DESTINATION',
          amount: destInterest,
          description: `Interesi i Zyrës së Destinacionit për dorëzim lokal (${targetShipment.trackingNumber})`,
        },
      ];

      await apiFetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ledgerPayload),
      });

      // 3. Update office cash balances in DB
      if (destOffice) {
        await apiFetch(`/api/offices/${destOffice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cashBalance: (destOffice.cashBalance || 0) + targetShipment.codAmount,
            earnedCommission: (destOffice.earnedCommission || 0) + destInterest,
          }),
        });
      }
      if (originOffice) {
        await apiFetch(`/api/offices/${originOffice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            earnedCommission: (originOffice.earnedCommission || 0) + originInterest,
          }),
        });
      }

      // 4. Re-sync to get fresh offices + ledgers
      await syncFromDB();
    } catch (err) {
      console.error('Error delivering shipment and collecting COD:', err);
    }
  };

  // ─── 7. Close Shipment at Cashier Desk ────────────────────────────────────
  const closeAndAuditShipment = async (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          log: {
            status: 'CLOSED',
            location: shipment.destinationOfficeName,
            notes: 'Dorëzimi i parave nga kurieri u verifikua. Dërgesa u mbyll zyrtarisht.',
            createdBy: currentUser?.name || 'System',
          }
        }),
      });
      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));
      }
    } catch (err) {
      console.error('Error closing shipment:', err);
    }
  };

  // ─── 8. Process Seller Settlements ────────────────────────────────────────
  const processSellerSettlements = async (): Promise<number> => {
    const unsettledShipments = shipments.filter(s => s.paymentStatus === 'COD_COLLECTED');
    if (unsettledShipments.length === 0) return 0;

    let totalSettledAmount = 0;

    try {
      // Mark all COD_COLLECTED shipments as SETTLED
      await Promise.all(
        unsettledShipments.map(s => {
          totalSettledAmount += s.sellerNet;
          return apiFetch(`/api/shipments/${s.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentStatus: 'SETTLED' }),
          });
        })
      );

      // Create ledger entries for settlements
      const settlementLedgers = unsettledShipments.map(s => ({
        shipmentId: s.id,
        trackingNumber: s.trackingNumber,
        officeId: s.originOfficeId,
        officeName: s.originOfficeName,
        sellerId: s.sellerId,
        sellerName: s.sellerName,
        type: 'SELLER_REVERSE_PAYOUT',
        amount: s.sellerNet,
        description: `Likuidimi mbrapsht te Shitësi (${s.sellerName}): Netto ${s.sellerNet} ALL (COD ${s.codAmount} ALL - Tarifa Postare ${s.shippingFee} ALL)`,
      }));

      await apiFetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlementLedgers),
      });

      await syncFromDB();
      return totalSettledAmount;
    } catch (err) {
      console.error('Error processing seller settlements:', err);
      return 0;
    }
  };

  // ─── 9. Register New User ──────────────────────────────────────────────────
  const registerUser = async (userData: { name: string; email: string; role?: UserRole }): Promise<User | null> => {
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          role: userData.role || 'PENDING',
        }),
      });
      if (res.success && res.user) {
        const newUser = res.user as User;
        setUsers(prev => [newUser, ...prev]);
        setCurrentUser(newUser);
        return newUser;
      }
      return null;
    } catch (err) {
      console.error('Error registering user:', err);
      return null;
    }
  };

  // ─── 10. Admin Approve User Role ──────────────────────────────────────────
  const approveUserRole = async (userId: string, role: UserRole, officeId?: string) => {
    const office = offices.find(o => o.id === officeId);
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          officeId: officeId || null,
          officeName: office ? office.name : null,
        }),
      });
      if (res.success && res.user) {
        setUsers(prev => prev.map(u => u.id === userId ? res.user : u));
        if (currentUser?.id === userId) setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Error approving user role:', err);
    }
  };

  // ─── 11. Admin Update User ─────────────────────────────────────────────────
  const updateUser = async (userId: string, data: Partial<User>) => {
    const office = data.officeId ? offices.find(o => o.id === data.officeId) : undefined;
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          officeName: office ? office.name : data.officeName,
        }),
      });
      if (res.success && res.user) {
        setUsers(prev => prev.map(u => u.id === userId ? res.user : u));
        if (currentUser?.id === userId) setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  // ─── 12. Admin Delete User ─────────────────────────────────────────────────
  const deleteUser = async (userId: string) => {
    try {
      await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser?.id === userId) setCurrentUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // ─── 13. Add Office ────────────────────────────────────────────────────────
  const addOffice = async (data: { name: string; city: string; cashBalance: number; intakePercentage?: number }) => {
    try {
      const res = await apiFetch('/api/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          city: data.city,
          cashBalance: data.cashBalance,
          intakePercentage: data.intakePercentage ?? 20,
        }),
      });
      if (res.success && res.office) {
        setOffices(prev => [...prev, res.office]);
      }
    } catch (err) {
      console.error('Error adding office:', err);
    }
  };

  // ─── 14. Update Office ─────────────────────────────────────────────────────
  const updateOffice = async (officeId: string, data: Partial<Office>) => {
    try {
      const res = await apiFetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.success && res.office) {
        setOffices(prev => prev.map(o => o.id === officeId ? res.office : o));
      }
    } catch (err) {
      console.error('Error updating office:', err);
    }
  };

  // ─── 15. Toggle Office Status ──────────────────────────────────────────────
  const toggleOfficeStatus = async (officeId: string) => {
    const office = offices.find(o => o.id === officeId);
    if (!office) return;
    const nextStatus = (office.status || 'ACTIVE') === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await apiFetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.success && res.office) {
        setOffices(prev => prev.map(o => o.id === officeId ? res.office : o));
      }
    } catch (err) {
      console.error('Error toggling office status:', err);
    }
  };

  // ─── 16. Delete Office ─────────────────────────────────────────────────────
  const deleteOffice = async (officeId: string) => {
    try {
      await apiFetch(`/api/offices/${officeId}`, { method: 'DELETE' });
      setOffices(prev => prev.filter(o => o.id !== officeId));
    } catch (err) {
      console.error('Error deleting office:', err);
    }
  };

  // ─── 17. Admin City Actions ───────────────────────────────────────────────
  const addCity = async (data: { name: string; officeId?: string | null }) => {
    try {
      const res = await apiFetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.success && res.city) {
        setCities(prev => [...prev, res.city].sort((a, b) => a.name.localeCompare(b.name)));
        return res.city;
      }
    } catch (err) {
      console.error('Error adding city:', err);
    }
    return null;
  };

  const updateCity = async (cityId: string, data: { name?: string; officeId?: string | null }) => {
    try {
      const res = await apiFetch('/api/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cityId, ...data }),
      });
      if (res.success && res.city) {
        setCities(prev => prev.map(c => c.id === cityId ? res.city : c));
      }
    } catch (err) {
      console.error('Error updating city:', err);
    }
  };

  const deleteCity = async (cityId: string) => {
    try {
      await apiFetch(`/api/cities?id=${cityId}`, { method: 'DELETE' });
      setCities(prev => prev.filter(c => c.id !== cityId));
    } catch (err) {
      console.error('Error deleting city:', err);
    }
  };

  // ─── Daily Office Cash Handover & Payout Approval ──────────────────────────
  const submitOfficeDailyHandover = async (officeId: string, amount: number, shipmentCount: number, notes?: string) => {
    const office = offices.find(o => o.id === officeId);
    if (!office || amount <= 0) return;

    try {
      await apiFetch('/api/handovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId,
          officeName: office.name,
          amount,
          shipmentCount,
          status: 'PENDING_APPROVAL',
          submittedBy: currentUser?.name || 'Stafi i Zyrës',
          notes: notes || 'Dorëzimi i arkës ditore te Financa Qendrore',
        }),
      });

      await apiFetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashBalance: Math.max(0, (office.cashBalance || 0) - amount) }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error submitting office handover:', err);
    }
  };

  const submitOfficeDailyHandoverWithCourier = async (
    officeId: string,
    amount: number,
    courierId: string,
    courierName: string,
    shipmentCount: number,
    notes?: string
  ) => {
    const office = offices.find(o => o.id === officeId);
    if (!office || amount <= 0) return;
    const transferCode = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await apiFetch('/api/handovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferCode,
          officeId,
          officeName: office.name,
          courierId,
          courierName,
          amount,
          shipmentCount,
          status: 'PENDING_COURIER_PICKUP',
          submittedBy: currentUser?.name || 'Stafi i Zyrës',
          notes: notes || `Mbyllja ditore me Kurierin ${courierName}`,
        }),
      });

      await apiFetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashBalance: Math.max(0, (office.cashBalance || 0) - amount) }),
      });

      await syncFromDB();
    } catch (err) {
      console.error('Error submitting office handover with courier:', err);
    }
  };

  const approveCashHandoverByCourier = async (handoverId: string, signature?: string) => {
    try {
      await apiFetch(`/api/handovers/${handoverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'TRANSIT_TO_FINANCE',
          courierSignature: signature || null,
        }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error approving cash handover by courier:', err);
    }
  };

  const rejectCashHandoverByCourier = async (handoverId: string, reason?: string) => {
    const handover = handovers.find(h => h.id === handoverId);
    try {
      await apiFetch(`/api/handovers/${handoverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: reason || 'Refuzuar nga kurieri i transportit',
        }),
      });

      // Restore office cash balance
      if (handover) {
        const office = offices.find(o => o.id === handover.officeId);
        if (office) {
          await apiFetch(`/api/offices/${office.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cashBalance: (office.cashBalance || 0) + handover.amount }),
          });
        }
      }

      await syncFromDB();
    } catch (err) {
      console.error('Error rejecting cash handover by courier:', err);
    }
  };

  const receiveOfficeHandoverInFinance = async (handoverId: string) => {
    try {
      await apiFetch(`/api/handovers/${handoverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RECEIVED_BY_FINANCE',
          financeRecipientName: currentUser?.name || 'Financa Qendrore',
        }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error receiving handover in finance:', err);
    }
  };

  const createPayoutDispatchBatch = async (
    officeId: string,
    courierId: string,
    courierName: string,
    sellerPayouts: import('./types').SellerPayoutItem[],
    adminProfitAmount: number,
    officeCommissionAmount: number
  ) => {
    const office = offices.find(o => o.id === officeId);
    const totalAmount = sellerPayouts.reduce((sum, s) => sum + s.amount, 0) + officeCommissionAmount;
    const batchCode = `BAT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await apiFetch('/api/payout-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCode,
          officeId,
          officeName: office?.name || 'Zyra',
          courierId,
          courierName,
          totalAmount,
          adminProfitAmount,
          officeCommissionAmount,
          sellerPayouts,
          itemsJson: JSON.stringify(sellerPayouts),
          status: 'PENDING_COURIER_PICKUP',
          dispatchedByName: currentUser?.name || 'Financa Qendrore',
        }),
      });

      if (officeCommissionAmount > 0) {
        try {
          const trackings = sellerPayouts.map(p => p.trackingNumber).filter(Boolean).join(', ');
          await apiFetch('/api/ledgers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              officeId,
              officeName: office?.name || 'Zyra',
              type: 'OFFICE_COMMISSION_PAYOUT',
              amount: officeCommissionAmount,
              description: `Shlyerja e komisionit të zyrës ${office?.name || 'Zyra'} (${officeCommissionAmount} ALL) me dërgesë zarfi`,
              trackingNumber: trackings || null
            }),
          });
        } catch (lErr) {
          console.error('Error recording office commission ledger:', lErr);
        }
      }

      await syncFromDB();
    } catch (err) {
      console.error('Error creating payout dispatch batch:', err);
    }
  };

  const approvePayoutBatchByCourier = async (batchId: string, signature?: string) => {
    try {
      await apiFetch(`/api/payout-batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_TRANSIT',
          courierSignature: signature || null,
        }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error approving payout batch by courier:', err);
    }
  };

  const rejectPayoutBatchByCourier = async (batchId: string, reason?: string) => {
    try {
      await apiFetch(`/api/payout-batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: reason || 'Refuzuar nga kurieri i transportit',
        }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error rejecting payout batch by courier:', err);
    }
  };

  const receivePayoutBatchAtOffice = async (batchId: string) => {
    try {
      await apiFetch(`/api/payout-batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RECEIVED_BY_OFFICE',
          receivedByName: currentUser?.name || 'Stafi i Zyrës',
        }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error receiving payout batch at office:', err);
    }
  };

  const rejectPayoutBatchFromOffice = async (batchId: string, notes?: string) => {
    try {
      await apiFetch(`/api/payout-batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: notes || 'Zarfi i pagesave u refuzua nga zyra për gabime' }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error rejecting payout batch at office:', err);
    }
  };

  const rejectOfficeHandoverInFinance = async (handoverId: string, notes?: string) => {
    try {
      await apiFetch(`/api/handovers/${handoverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: notes || 'Arka cash u refuzua nga financa për gabime' }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error rejecting office handover in finance:', err);
    }
  };

  const approveOfficeDailyHandover = async (handoverId: string) => {
    try {
      await apiFetch(`/api/handovers/${handoverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          financeRecipientName: currentUser?.name || 'Financa Qendrore',
        }),
      });
      await syncFromDB();
    } catch (err) {
      console.error('Error approving office daily handover:', err);
    }
  };

  const completeSellerPayoutFromOffice = async (shipmentId: string) => {
    try {
      const shipment = shipments.find(s => s.id === shipmentId);
      if (!shipment) return;

      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          paymentStatus: 'SETTLED',
          log: {
            status: 'CLOSED',
            location: currentUser?.officeName || 'Zyra',
            notes: `Likuidimi mbrapsht u krye me sukses te shitësi (${shipment.sellerName}). Dërgesa u mbyll.`,
            createdBy: currentUser?.name || 'System',
          }
        }),
      });

      if (res.success && res.shipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? res.shipment : s));

        // Create SELLER_SETTLEMENT ledger entry
        try {
          await apiFetch('/api/ledgers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shipmentId: shipment.id,
              trackingNumber: shipment.trackingNumber,
              officeId: shipment.originOfficeId,
              officeName: shipment.originOfficeName,
              sellerId: shipment.sellerId,
              sellerName: shipment.sellerName,
              type: 'SELLER_SETTLEMENT',
              amount: shipment.sellerNet,
              description: `Likuidimi mbrapsht te Shitësi (${shipment.sellerName}): Netto ${shipment.sellerNet} ALL (COD ${shipment.codAmount} ALL - Tarifa ${shipment.shippingFee} ALL)`,
            }),
          });
        } catch (lErr) {
          console.error('Error creating seller settlement ledger:', lErr);
        }

        await syncFromDB();
      }
    } catch (err) {
      console.error('Error completing seller payout:', err);
    }
  };

  const completeSellerPayoutWithProof = async (payload: {
    shipmentId: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER';
    recipientName: string;
    recipientIdCard?: string;
    signatureUrl?: string;
    verificationCode?: string;
    bankReference?: string;
    notes?: string;
  }): Promise<SellerPayoutProof | null> => {
    try {
      const shipment = shipments.find(s => s.id === payload.shipmentId);
      if (!shipment) return null;

      const currentOfficeName = currentUser?.officeName || shipment.originOfficeName || 'Zyra';
      const currentOfficeId = currentUser?.officeId || shipment.originOfficeId || '';

      // 1. Create Seller Payout Proof record
      const proofRes = await apiFetch('/api/seller-payout-proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          sellerId: shipment.sellerId,
          sellerName: shipment.sellerName,
          amount: shipment.sellerNet,
          paymentMethod: payload.paymentMethod,
          recipientName: payload.recipientName,
          recipientIdCard: payload.recipientIdCard,
          signatureUrl: payload.signatureUrl,
          verificationCode: payload.verificationCode,
          bankReference: payload.bankReference,
          officeId: currentOfficeId,
          officeName: currentOfficeName,
          processedBy: currentUser?.name || 'Stafi i Zyrës',
          notes: payload.notes,
        }),
      });

      // 2. Update shipment to CLOSED & SETTLED
      await apiFetch(`/api/shipments/${shipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          paymentStatus: 'SETTLED',
          log: {
            status: 'CLOSED',
            location: currentOfficeName,
            notes: `Likuidimi me dëshmi zyrtare (${payload.paymentMethod}): Marrës ${payload.recipientName}. Shuma ${shipment.sellerNet} ALL u kalua me sukses.`,
            createdBy: currentUser?.name || 'System',
          }
        }),
      });

      // 3. Create SELLER_SETTLEMENT ledger entry
      try {
        await apiFetch('/api/ledgers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            officeId: currentOfficeId,
            officeName: currentOfficeName,
            sellerId: shipment.sellerId,
            sellerName: shipment.sellerName,
            type: 'SELLER_SETTLEMENT',
            amount: shipment.sellerNet,
            description: `Likuidimi mbrapsht me dëshmi te Shitësi (${shipment.sellerName}): Netto ${shipment.sellerNet} ALL (COD ${shipment.codAmount} ALL - Tarifa ${shipment.shippingFee} ALL)`,
          }),
        });
      } catch (lErr) {
        console.error('Error creating seller settlement ledger:', lErr);
      }

      await syncFromDB();
      return proofRes.success ? (proofRes.proof as SellerPayoutProof) : null;
    } catch (err) {
      console.error('Error completing seller payout with proof:', err);
      return null;
    }
  };

  // ─── Helper ────────────────────────────────────────────────────────────────
  const getShipmentByTracking = (code: string) => {
    const clean = code.trim().replace(/\*/g, '').toUpperCase();
    return shipments.find(s => s.trackingNumber.toUpperCase() === clean);
  };

  return (
    <AppStateContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        offices,
        shipments,
        ledgers,
        bags,
        handovers,
        payoutBatches,
        payoutProofs,
        isLoading,
        syncFromDB,
        createShipment,
        cancelShipment,
        deleteShipment,
        pickupShipment,
        transportShipment,
        receiveShipmentAtOffice,
        assignDeliveryCourier,
        createBag,
        approveBag,
        rejectBag,
        completeBag,
        receiveBagAtOffice,
        deliverShipmentAndCollectCOD,
        closeAndAuditShipment,
        processSellerSettlements,
        submitOfficeDailyHandover,
        submitOfficeDailyHandoverWithCourier,
        approveOfficeDailyHandover,
        approveCashHandoverByCourier,
        rejectCashHandoverByCourier,
        receiveOfficeHandoverInFinance,
        rejectOfficeHandoverInFinance,
        createPayoutDispatchBatch,
        approvePayoutBatchByCourier,
        rejectPayoutBatchByCourier,
        receivePayoutBatchAtOffice,
        rejectPayoutBatchFromOffice,
        completeSellerPayoutFromOffice,
        completeSellerPayoutWithProof,
        registerUser,
        approveUserRole,
        updateUser,
        deleteUser,
        addOffice,
        updateOffice,
        toggleOfficeStatus,
        deleteOffice,
        cities,
        addCity,
        updateCity,
        deleteCity,
        getShipmentByTracking,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

/**
 * Like useAppState but with currentUser typed as non-null User.
 * Use this in any page/component that requires the user to be logged in.
 * The parent layout or middleware should redirect unauthenticated users to /login.
 */
export const useAuthenticatedState = () => {
  const state = useAppState();
  return state as Omit<typeof state, 'currentUser'> & { currentUser: import('./types').User };
};

