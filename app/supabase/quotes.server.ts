import { supabase } from "./supabase.server";

export const fetchQuotes = async () => {
  let { data, error } = await supabase.from("quotes").select("*");

  if (error || !data) return;

  return data;
};
