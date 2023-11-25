import { supabase } from "./supabase.server";

export const fetchQuotes = async () => {
  let { data, error } = await supabase.from("quotes").select("*");

  if (error || !data) return;

  return data;
};

export const insertQuote = async (quote: {
  quote: string;
  author: string;
  date: string;
  note?: string;
  associated_user_id: number;
}) => {
  let { error } = await supabase.from("quotes").insert([quote]);

  return error;
};

export const deleteQuote = async (id: number) => {
  let { error } = await supabase.from("quotes").delete().match({ id });

  return error;
};
