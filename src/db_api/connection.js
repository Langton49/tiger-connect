import { createClient } from "@supabase/supabase-js"; // Import the Supabase client library
// Initialize the Supabase client with the Supabase URL and API key
// Define a class for the Supabase database connection
// This class will handle the connection to the Supabase database and provide methods for interacting with it
class SupabaseDbConnection {

    // Define the constructor for the class
    // Create a Supabase client instance using the URL and API key from environment variables
    constructor() {
        this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    // Sign up method to create a new user in the database

    async signup(fname, lname, email, gnumber, password) {
        try {
            // Uses default email and password authentication method provided by Supabase
            // Creates a new user in the Supabase authentication system (aka `auth` table)
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password // Password and email validation will be handled client-side, hashing will be done by Supabase.
            });

            // If an error occurs during sign up, return an error message
            if (error) {
                console.log(error.message);
                throw new Error(error.message);
            }

            // If sign up to `auth` table is successful, insert the user data into our own personal table `user_table`
            // `user-table` has the following columns: `first_name`, `last_name`, `g_number`, `user_id` (which is a foreign key to the `auth` table)
            if ((await this.userExists(gnumber)).exists) {
                await this.supabase.auth.api.deleteUser(data.user.id);
                throw new Error('User already exists');
            }

            const { data: userData, error: insertError } = await this.supabase.from('user_table')
                .insert([{
                    first_name: fname,
                    last_name: lname,
                    g_number: gnumber,
                    verified: false,
                    user_id: data.user.id,
                },
                ]);

            // If an error occurs during the insert operation, return an error message
            if (insertError) {
                await this.supabase.auth.api.deleteUser(data.user.id);
                throw new Error(insertError.message);
            }

            // If both operations are successful, return a success message
            return {
                success: true,
                data: {
                    user_id: data.user.id,
                    first_name: fname,
                    last_name: lname,
                    email: email,
                    g_number: gnumber,
                    verified: false,
                    joinedAt: new Date(data.user.created_at)
                }
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }

    }

    // Check if a user exists in the database by email
    async userExists(gnumber) {
        try {

            // Queries the `user_table` to check if a user with the given gnumber already exists
            const { data, error } = await this.supabase.from('user_table')
                .select('*')
                .eq('g_number', gnumber)
                .maybeSingle();

            if (error) throw new Error(error.message);

            return { exists: !!data, error: null };

        } catch (error) {
            return { exists: false, error: error.message }
        }
    }

    // Login a user by email and password
    async login(email, password) {
        try {

            // Uses the default email and password authentication method provided by Supabase
            // Went with email authentication instead of gnumber because it is guaranteed to be secure
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            })

            // In case of an error during login, return an error message
            if (error) throw new Error(error.message);

            // If the login is successful, fetch the user data from the `user_table` using the user ID from the authentication response
            const { data: userData, error: readError } = await this.supabase.from('user_table')
                .select('*')
                .eq('user_id', data.user.id)
                .maybeSingle();

            // In case of an error during the fetch operation, return an error message
            if (readError) throw new Error(readError.message);

            // Match the response from the login to the `User` object defined under `src/models`
            return {
                success: true,
                data: {
                    user_id: userData.user_id,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: data.user.email,
                    g_number: userData.g_number,
                    verified: userData.verified,
                    joinedAt: new Date(data.user.created_at)
                }
            }
        } catch (error) {
            console.log(error.message);
            return { success: false, error: error.message }
        }
    }

    // Logout a user from the application
    async logout() {
        try {
            // Uses the default email and password authentication method provided by Supabase
            const { error } = await this.supabase.auth.signOut();

            if (error) throw new Error(error.message);

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Make supabase storage bucket 
    // Store url of image in supabase storage bucket
    // Store url in the `images` column of the `marketplace_items` table

    async listItemsToMarketPlace(name, desc, price, seller_id, condition, category, images) {
        try {
            const imageUrls = await this.uploadImagesToBucket(images, seller_id);
            const { data, error } = await this.supabase.from('marketplace_items')
                .insert([{
                    title: name,
                    description: desc,
                    price: price,
                    seller_id: seller_id,
                    condition: condition,
                    category: category,
                    images: imageUrls.data,
                    status: "NA"
                }])

            if (error) throw new Error(error.message);
            return { success: true, data: data }
        } catch (error) {
            return { success: false, error: error.message }
        }

    }

    async listServices(name, desc, rate, rateType, category, providerId, availability, image) {
        try {
            const imageUrl = await this.uploadImagesToBucket([image], providerId);
            const { data, error } = await this.supabase.from('services_table')
                .insert([{
                    title: name,
                    description: desc,
                    rate: rate,
                    rateType: rateType,
                    category: category,
                    provider_id: providerId,
                    availability: availability,
                    image: imageUrl.data[0]
                }])

            if (error) throw new Error(error.message);
            return { success: true, data: data }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    async uploadImagesToBucket(images, currentUserId) {
        try {
            const imageUrls = await Promise.all(
                images.map(async (base64Image) => {
                    const filePath = `pictures/${currentUserId}/${Date.now()}.png`;

                    const { error: uploadError } = await this.supabase.storage
                        .from('pictures')
                        .upload(filePath, this.dataURLtoBlob(base64Image));

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = await this.supabase.storage
                        .from('pictures')
                        .getPublicUrl(filePath);

                    return publicUrl;
                })
            );
            return { success: true, data: imageUrls };
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    async getMarketPlaceListings() {
        try {
            const { data: listings, error: err } = await this.supabase.from('marketplace_items').select('*');
            if (err) throw new Error(err.message);
            return { success: true, data: listings }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    async getServicesListings() {
        try {
            const { data: services, error: err } = await this.supabase.from('services_table').select('*');
            if (err) throw new Error(err.message);
            return { success: true, data: services }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    async getUsers() {
        try {
            const { data: users, error: err } = await this.supabase.from('user_table').select('*');
            if (err) throw new Error(err.message);
            console.log(users);
            return { success: true, data: users }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
    // Send a new message
    async sendMessage(senderId, receiverId, content) {
        try {
            // Ensure both IDs are strings
            const senderIdStr = String(senderId);
            const receiverIdStr = String(receiverId);
            
            console.log('Sending message with parameters:', {
                sender_id: senderIdStr,
                receiver_id: receiverIdStr,
                content: content
            });
            
            const { data, error } = await this.supabase
                .from('Messages')
                .insert([
                    {
                        sender_id: senderIdStr,
                        receiver_id: receiverIdStr,
                        content: content,
                    }
                ]);

            if (error) {
                console.error('Error sending message:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error in sendMessage:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Get all messages between two users
    async getMessages(userA, userB) {
        try {
            // Ensure both IDs are strings
            const userAStr = String(userA);
            const userBStr = String(userB);
            
            console.log('Fetching messages between users:', {
                userA: userAStr,
                userB: userBStr
            });
            
            // First query: messages from userA to userB
            const { data: sentMessages, error: sentError } = await this.supabase
                .from('Messages')
                .select('*')
                .eq('sender_id', userAStr)
                .eq('receiver_id', userBStr);
            
            if (sentError) {
                console.error('Error fetching sent messages:', sentError.message);
                return { success: false, error: sentError.message };
            }
            
            // Second query: messages from userB to userA
            const { data: receivedMessages, error: receivedError } = await this.supabase
                .from('Messages')
                .select('*')
                .eq('sender_id', userBStr)
                .eq('receiver_id', userAStr);
            
            if (receivedError) {
                console.error('Error fetching received messages:', receivedError.message);
                return { success: false, error: receivedError.message };
            }
            
            // Combine and sort the messages
            const allMessages = [...sentMessages, ...receivedMessages].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
            
            return { success: true, messages: allMessages };
        } catch (err) {
            console.error('Unexpected error in getMessages:', err);
            return { success: false, error: "Unexpected error while fetching messages." };
        }
    }
    // Fetch recent conversations for the logged-in user
    async getConversations(currentUserId) {
        try {
            // Ensure ID is a string
            const currentUserIdStr = String(currentUserId);
            
            console.log('Fetching conversations for user:', currentUserIdStr);
            
            // Fetch all messages where currentUserId is sender
            const { data: sentMessages, error: sentError } = await this.supabase
                .from("Messages")
                .select("sender_id, receiver_id")
                .eq("sender_id", currentUserIdStr);

            if (sentError) {
                console.error('Error fetching sent messages:', sentError.message);
                throw new Error(sentError.message);
            }

            // Fetch all messages where currentUserId is receiver
            const { data: receivedMessages, error: receivedError } = await this.supabase
                .from("Messages")
                .select("sender_id, receiver_id")
                .eq("receiver_id", currentUserIdStr);

            if (receivedError) {
                console.error('Error fetching received messages:', receivedError.message);
                throw new Error(receivedError.message);
            }

            // Extract conversation partners
            const partnerIds = new Set();
            
            // From sent messages, add receivers
            sentMessages.forEach(msg => {
                partnerIds.add(msg.receiver_id);
            });
            
            // From received messages, add senders
            receivedMessages.forEach(msg => {
                partnerIds.add(msg.sender_id);
            });

            const uniqueIds = Array.from(partnerIds);

            if (uniqueIds.length === 0) {
                return { success: true, data: [] };
            }

            // Fetch their info from user_table
            const { data: users, error: userError } = await this.supabase
                .from("user_table")
                .select("user_id, first_name, last_name, email")
                .in("user_id", uniqueIds);

            if (userError) {
                console.error('Error fetching user info:', userError.message);
                throw new Error(userError.message);
            }

            return { success: true, data: users };
        } catch (error) {
            console.error('Unexpected error in getConversations:', error);
            return { success: false, error: error.message };
        }
    }

}
// Export the Supabase connection instance
export const supabaseCon = new SupabaseDbConnection();