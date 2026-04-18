import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

/**
 * Supabase の entries テーブルからデータを読み書きするフック
 * 
 * window.storage.get("bq-v3") → supabase.from("entries").select()
 * window.storage.set("bq-v3", data) → supabase.from("entries").upsert()
 */
export function useEntries() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // 全データを読み込む
  useEffect(() => {
    async function fetchAll() {
      try {
        const { data: rows, error } = await supabase
          .from("entries")
          .select("*");

        if (error) {
          console.error("Supabase fetch error:", error);
          setLoading(false);
          return;
        }

        // rows を { "2026-04-12": { swings: 50, ... }, ... } の形に変換
        const mapped = {};
        for (const row of rows) {
          mapped[row.date] = {
            swings: row.swings || 0,
            pitches: row.pitches || 0,
            bcAtBats: row.bc_at_bats || 0,
            bcHits: row.bc_hits || 0,
            gameAtBats: row.game_at_bats || 0,
            gameHits: row.game_hits || 0,
          };
        }
        setData(mapped);
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  // 1日分のデータを保存（upsert = あれば更新、なければ挿入）
  const saveEntry = useCallback(async (dateKey, entry) => {
    // まずローカル state を即座に更新（画面の反応を速くする）
    setData(prev => ({ ...prev, [dateKey]: entry }));

    // Supabase に保存
    try {
      const { error } = await supabase
        .from("entries")
        .upsert({
          date: dateKey,
          swings: entry.swings || 0,
          pitches: entry.pitches || 0,
          bc_at_bats: entry.bcAtBats || 0,
          bc_hits: entry.bcHits || 0,
          game_at_bats: entry.gameAtBats || 0,
          game_hits: entry.gameHits || 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "date",
        });

      if (error) {
        console.error("Supabase save error:", error);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  }, []);

  return { data, loading, saveEntry };
}
