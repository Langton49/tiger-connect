import { createClient } from "@supabase/supabase-js";

class SupabaseDbConnection {
    supabaseUrl: string;
    supabaseKey: string;
    supabase: any;

    constructor() {
        this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    async signup(
        fname: string,
        lname: string,
        email: string,
        gnumber: string,
        password: string
    ) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw new Error(error.message);

            if ((await this.userExists(gnumber)).exists) {
                await this.supabase.auth.api.deleteUser(data.user.id);
                throw new Error("User already exists");
            }

            const { error: insertError } = await this.supabase
                .from("user_table")
                .insert([
                    {
                        first_name: fname,
                        last_name: lname,
                        g_number: gnumber,
                        verified: false,
                        user_id: data.user.id,
                    },
                ]);

            if (insertError) {
                await this.supabase.auth.api.deleteUser(data.user.id);
                throw new Error(insertError.message);
            }

            return {
                success: true,
                data: {
                    user_id: data.user.id,
                    first_name: fname,
                    last_name: lname,
                    email,
                    g_number: gnumber,
                    verified: false,
                    joinedAt: new Date(data.user.created_at),
                },
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async userExists(gnumber: string) {
        try {
            const { data, error } = await this.supabase
                .from("user_table")
                .select("*")
                .eq("g_number", gnumber)
                .maybeSingle();

            if (error) throw new Error(error.message);

            return { exists: !!data, error: null };
        } catch (error: any) {
            return { exists: false, error: error.message };
        }
    }

    getUnreadNotificationCount(
        userId: string
    ): Promise<{ success: boolean; count?: number; error?: string }> {
        return new Promise(async (resolve) => {
            try {
                const userIdStr = String(userId);

                const { data, error, count } = await this.supabase
                    .from("Notifications")
                    .select("*", { count: "exact" })
                    .eq("user_id", userIdStr)
                    .eq("read", false);

                if (error) {
                    console.error(
                        "Error counting notifications:",
                        error.message
                    );
                    resolve({ success: false, error: error.message });
                    return;
                }

                resolve({ success: true, count });
            } catch (err: any) {
                console.error("Unexpected error counting notifications:", err);
                resolve({
                    success: false,
                    error: "Unexpected error while counting notifications.",
                });
            }
        });
    }
}

export const supabaseCon = new SupabaseDbConnection();
