import { createClient } from "@supabase/supabase-js"; // Import the Supabase client library

class SupabaseDbConnection {
    constructor() {
        this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // ✅ Updated to match your .env
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    async signup(fname, lname, email, gnumber, password) {
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
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async userExists(gnumber) {
        try {
            const { data, error } = await this.supabase
                .from("user_table")
                .select("*")
                .eq("g_number", gnumber)
                .maybeSingle();

            if (error) throw new Error(error.message);

            return { exists: !!data, error: null };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword(
                { email, password }
            );

            if (error) throw new Error(error.message);

            const { data: userData, error: readError } = await this.supabase
                .from("user_table")
                .select("*")
                .eq("user_id", data.user.id)
                .maybeSingle();

            if (readError) throw new Error(readError.message);

            return {
                success: true,
                data: {
                    user_id: userData.user_id,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: data.user.email,
                    g_number: userData.g_number,
                    verified: userData.verified,
                    joinedAt: new Date(data.user.created_at),
                },
            };
        } catch (error) {
            console.log(error.message);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw new Error(error.message);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async listItemsToMarketPlace(
        name,
        desc,
        price,
        seller_id,
        condition,
        category,
        images
    ) {
        try {
            const imageUrls = await this.uploadImagesToBucket(
                images,
                seller_id
            );
            const { data, error } = await this.supabase
                .from("marketplace_items")
                .insert([
                    {
                        title: name,
                        description: desc,
                        price,
                        seller_id,
                        condition,
                        category,
                        images: imageUrls.data,
                        status: "NA",
                    },
                ]);

            if (error) throw new Error(error.message);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async listServices(
        name,
        desc,
        rate,
        rateType,
        category,
        providerId,
        availability,
        image
    ) {
        try {
            const imageUrl = await this.uploadImagesToBucket(
                [image],
                providerId
            );
            const { data, error } = await this.supabase
                .from("services_table")
                .insert([
                    {
                        title: name,
                        description: desc,
                        rate,
                        rateType,
                        category,
                        provider_id: providerId,
                        availability,
                        image: imageUrl.data[0],
                    },
                ]);

            if (error) throw new Error(error.message);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async uploadImagesToBucket(images, currentUserId) {
        try {
            const imageUrls = await Promise.all(
                images.map(async (base64Image) => {
                    const filePath = `pictures/${currentUserId}/${Date.now()}.png`;
                    const { error: uploadError } = await this.supabase.storage
                        .from("pictures")
                        .upload(filePath, this.dataURLtoBlob(base64Image));
                    if (uploadError) throw uploadError;
                    const {
                        data: { publicUrl },
                    } = await this.supabase.storage
                        .from("pictures")
                        .getPublicUrl(filePath);
                    return publicUrl;
                })
            );
            return { success: true, data: imageUrls };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    }

    async getMarketPlaceListings() {
        try {
            const { data, error } = await this.supabase
                .from("marketplace_items")
                .select("*");
            if (error) throw new Error(error.message);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getServicesListings() {
        try {
            const { data, error } = await this.supabase
                .from("services_table")
                .select("*");
            if (error) throw new Error(error.message);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUsers() {
        try {
            const { data, error } = await this.supabase
                .from("user_table")
                .select("*");
            if (error) throw new Error(error.message);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendMessage(senderId, receiverId, content) {
        try {
            const { data, error } = await this.supabase
                .from("Messages")
                .insert([
                    { sender_id: senderId, receiver_id: receiverId, content },
                ]);
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } catch (err) {
            return {
                success: false,
                error: "Unexpected error. Please try again.",
            };
        }
    }

    async getMessages(userA, userB) {
        try {
            const { data, error } = await this.supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`
                )
                .order("created_at", { ascending: true });
            if (error) return { success: false, error: error.message };
            return { success: true, messages: data };
        } catch (err) {
            return {
                success: false,
                error: "Unexpected error while fetching messages.",
            };
        }
    }
}

export const supabaseCon = new SupabaseDbConnection();
