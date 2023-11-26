import { supabase } from "./supabase.server";

export const fetchUser = async (username: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);

  if (error) return;

  if (data.length !== 1) {
    return {
      userNotFound: true,
    };
  }

  return {
    userId: data?.[0].id,
    username: data?.[0].username,
    passwordHash: data?.[0].password_hash,
  };
};

export const addUser = async (username: string, passwordHash: string) => {
  return await supabase
    .from("users")
    .insert([
      {
        username,
        password_hash: passwordHash,
      },
    ])
    .select("*");
};
