import React, { createContext, useContext, useState, useCallback } from 'react';
import { getLevel, getPrefix, fullName } from '../data';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang]   = useState('ar');
  const [user, setUser]   = useState(null);
  const [track, setTrack] = useState(null);
  const [gems, setGems]   = useState(50);
  const [stationery, setStationery] = useState({
    pen:    { id: 'pen_basic', inkLeft: 100 },
    eraser: { uses: 20 },
    pages:  { left: 30 },
  });

  const addGems = useCallback((amount) => {
    setGems(prev => prev + amount);
  }, []);

  const useInk = useCallback(() => {
    setStationery(prev => ({
      ...prev,
      pen: { ...prev.pen, inkLeft: Math.max(0, prev.pen.inkLeft - 1) },
    }));
  }, []);

  const useEraser = useCallback(() => {
    setStationery(prev => ({
      ...prev,
      eraser: { uses: Math.max(0, prev.eraser.uses - 1) },
    }));
  }, []);

  const usePage = useCallback(() => {
    setStationery(prev => ({
      ...prev,
      pages: { left: Math.max(0, prev.pages.left - 1) },
    }));
  }, []);

  const buyItem = useCallback((item) => {
    if (gems < item.price) return false;
    setGems(prev => prev - item.price);
    setStationery(prev => {
      if (item.type === 'pen')    return { ...prev, pen:    { id: item.id, inkLeft: item.ink } };
      if (item.type === 'eraser') return { ...prev, eraser: { uses: item.uses } };
      if (item.type === 'paper')  return { ...prev, pages:  { left: prev.pages.left + item.pages } };
      return prev;
    });
    return true;
  }, [gems]);

  const claimGift = useCallback((reward) => {
    if (reward.type === 'gems') {
      addGems(reward.amount);
    } else if (reward.type === 'pen') {
      setStationery(prev => ({ ...prev, pen: { id: reward.item, inkLeft: 100 } }));
    } else if (reward.type === 'eraser') {
      setStationery(prev => ({ ...prev, eraser: { uses: prev.eraser.uses + 20 } }));
    } else if (reward.type === 'paper') {
      setStationery(prev => ({ ...prev, pages: { left: prev.pages.left + 20 } }));
    }
  }, [addGems]);

  const value = {
    lang, setLang,
    user, setUser,
    track, setTrack,
    gems, addGems,
    stationery, useInk, useEraser, usePage, buyItem, claimGift,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
