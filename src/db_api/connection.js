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
            console.log('Starting marketplace listing with parameters:', {
                title: name,
                seller_id: seller_id,
                category: category,
                images_count: images.length
            });
            
            const imageUrls = await this.uploadImagesToBucket(images, seller_id);
            
            if (!imageUrls.success) {
                console.error('Failed to upload images:', imageUrls.error);
                return { success: false, error: 'Failed to upload images: ' + imageUrls.error };
            }
            
            console.log('Images uploaded successfully, adding listing to database');
            
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
                .select(); // Add .select() to return the inserted rows

            if (error) {
                console.error('Error inserting marketplace item:', error.message);
                throw new Error(error.message);
            }
            
            console.log('Marketplace listing successful, data:', data);
            return { success: true, data: data }
        } catch (error) {
            return { success: false, error: error.message };
            console.error('Error in listItemsToMarketPlace:', error);
            return { success: false, error: error.message }
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
            console.log('Starting service listing with parameters:', {
                title: name,
                provider_id: providerId,
                category: category,
                has_image: !!image
            });
            
            const imageUrl = await this.uploadImagesToBucket([image], providerId);
            
            if (!imageUrl.success) {
                console.error('Failed to upload service image:', imageUrl.error);
                return { success: false, error: 'Failed to upload image: ' + imageUrl.error };
            }
            
            console.log('Image uploaded successfully, adding service to database');
            
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
                .select(); // Add .select() to return the inserted rows

            if (error) {
                console.error('Error inserting service:', error.message);
                throw new Error(error.message);
            }
            
            console.log('Service listing successful, data:', data);
            return { success: true, data: data }
        } catch (error) {
            return { success: false, error: error.message };
            console.error('Error in listServices:', error);
            return { success: false, error: error.message }
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
            // Ensure both IDs are strings
            const senderIdStr = String(senderId);
            const receiverIdStr = String(receiverId);
            
            console.log('Sending message with parameters:', {
                sender_id: senderIdStr,
                receiver_id: receiverIdStr,
                content: content
            });
            
            const { data, error } = await this.supabase
                .from("Messages")
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
            return {
                success: false,
                error: "Unexpected error. Please try again.",
            };
            console.error('Unexpected error in sendMessage:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

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
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
            
            console.log('🔍 getConversations - Looking for conversations for user:', currentUserIdStr);
            
            // Debug: Check if the Messages table exists and has right structure
            const { data: tableInfo, error: tableError } = await this.supabase
                .from('Messages')
                .select('count(*)', { count: 'exact' })
                .limit(1);
                
            console.log('🔍 Messages table check:', { tableInfo, tableError });
            
            // Fetch all messages where currentUserId is sender
            const { data: sentMessages, error: sentError } = await this.supabase
                .from("Messages")
                .select("sender_id, receiver_id, content, created_at")
                .eq("sender_id", currentUserIdStr);

            console.log('📤 Sent messages:', { 
                count: sentMessages?.length || 0, 
                messages: sentMessages,
                error: sentError
            });
            
            if (sentError) {
                console.error('❌ Error fetching sent messages:', sentError.message);
                throw new Error(sentError.message);
            }

            // Fetch all messages where currentUserId is receiver
            const { data: receivedMessages, error: receivedError } = await this.supabase
                .from("Messages")
                .select("sender_id, receiver_id, content, created_at")
                .eq("receiver_id", currentUserIdStr);

            console.log('📥 Received messages:', { 
                count: receivedMessages?.length || 0, 
                messages: receivedMessages,
                error: receivedError
            });
            
            if (receivedError) {
                console.error('❌ Error fetching received messages:', receivedError.message);
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
            console.log('👥 Unique conversation partners found:', uniqueIds);

            if (uniqueIds.length === 0) {
                console.log('ℹ️ No conversation partners found for user:', currentUserIdStr);
                return { success: true, data: [] };
            }

            // Fetch their info from user_table
            const { data: users, error: userError } = await this.supabase
                .from("user_table")
                .select("user_id, first_name, last_name")
                .in("user_id", uniqueIds);

            console.log('👤 Conversation partners info:', { 
                count: users?.length || 0, 
                users,
                error: userError
            });
            
            if (userError) {
                console.error('❌ Error fetching user info:', userError.message);
                throw new Error(userError.message);
            }

            return { success: true, data: users };
        } catch (error) {
            console.error('❌ Unexpected error in getConversations:', error);
            return { success: false, error: error.message };
        }
    }

    // Add a notification for a user
    async addNotification(userId, type, title, message, relatedId = null) {
        try {
            if (!userId) {
                console.error('Missing userId in addNotification', { userId, type, title });
                return { success: false, error: 'Missing user ID' };
            }
            
            const userIdStr = String(userId);
            
            console.log('Adding notification with parameters:', {
                user_id: userIdStr,
                type,
                title,
                message,
                relatedId
            });
            
            try {
                const { data, error } = await this.supabase
                    .from('Notifications')
                    .insert([{
                        user_id: userIdStr,
                        type: type, // 'message', 'listing', 'purchase', 'sale', 'booking'
                        title: title,
                        message: message,
                        related_id: relatedId,
                        read: false,
                        created_at: new Date()
                    }]);
                    
                if (error) {
                    console.error('Error adding notification to database:', error.message, error);
                    return { success: false, error: error.message };
                }
                
                console.log('Notification added successfully:', data);
                return { success: true, data };
            } catch (dbError) {
                console.error('Database error when adding notification:', dbError);
                return { success: false, error: 'Database error: ' + dbError.message };
            }
        } catch (err) {
            console.error('Unexpected error adding notification:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }
    
    // Get notifications for a user
    async getNotifications(userId) {
        try {
            const userIdStr = String(userId);
            
            console.log('Fetching notifications for user:', userIdStr);
            
            const { data, error } = await this.supabase
                .from('Notifications')
                .select('*')
                .eq('user_id', userIdStr)
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('Error fetching notifications:', error.message);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching notifications:', err);
            return { success: false, error: "Unexpected error while fetching notifications." };
        }
    }
    
    // Mark a notification as read
    async markNotificationRead(notificationId, isRead = true) {
        try {
            const { data, error } = await this.supabase
                .from('Notifications')
                .update({ read: isRead })
                .eq('id', notificationId);
                
            if (error) {
                console.error('Error updating notification:', error.message);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (err) {
            return {
                success: false,
                error: "Unexpected error while fetching messages.",
            };
        }
            console.error('Unexpected error updating notification:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }
    
    // Get unread notification count for a user
    async getUnreadNotificationCount(userId) {
        try {
            const userIdStr = String(userId);
            
            const { data, error, count } = await this.supabase
                .from('Notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', userIdStr)
                .eq('read', false);
                
            if (error) {
                console.error('Error counting notifications:', error.message);
                return { success: false, error: error.message };
            }
            
            return { success: true, count };
        } catch (err) {
            console.error('Unexpected error counting notifications:', err);
            return { success: false, error: "Unexpected error while counting notifications." };
        }
    }

    // Helper: Create a message notification
    async createMessageNotification(receiverId, senderId, senderName) {
        console.log('Creating message notification with params:', { receiverId, senderId, senderName });
        
        if (!receiverId || !senderId) {
            console.error('Missing required parameters for createMessageNotification', { receiverId, senderId });
            return { success: false, error: 'Missing required parameters' };
        }
        
        const title = "New Message";
        const message = `You have a new message from ${senderName}`;
        return this.addNotification(receiverId, 'message', title, message, senderId);
    }
    
    // Helper: Create a new listing notification
    async createNewListingNotification(ownerId, listingId, listingTitle) {
        const title = "Listing Published";
        const message = `Your item "${listingTitle}" has been successfully listed for sale`;
        return this.addNotification(ownerId, 'listing', title, message, listingId);
    }
    
    // Helper: Create a new service notification
    async createNewServiceNotification(providerId, serviceId, serviceTitle) {
        const title = "Service Published";
        const message = `Your service "${serviceTitle}" has been successfully listed`;
        return this.addNotification(providerId, 'service', title, message, serviceId);
    }
    
    // Helper: Create a purchase notification
    async createPurchaseNotification(buyerId, sellerId, orderId, itemTitle) {
        // Notify buyer
        const buyerTitle = "Purchase Successful";
        const buyerMessage = `You have successfully purchased "${itemTitle}"`;
        await this.addNotification(buyerId, 'purchase', buyerTitle, buyerMessage, orderId);
        
        // Notify seller
        const sellerTitle = "Item Sold";
        const sellerMessage = `Your item "${itemTitle}" has been purchased`;
        return this.addNotification(sellerId, 'sale', sellerTitle, sellerMessage, orderId);
    }
    
    // Helper: Create a booking notification
    async createBookingNotification(userId, providerId, bookingId, serviceTitle) {
        // Notify user who booked
        const userTitle = "Booking Confirmed";
        const userMessage = `Your booking for "${serviceTitle}" has been confirmed`;
        await this.addNotification(userId, 'booking', userTitle, userMessage, bookingId);
        
        // Notify service provider
        const providerTitle = "New Booking";
        const providerMessage = `Someone has booked your service "${serviceTitle}"`;
        return this.addNotification(providerId, 'booking', providerTitle, providerMessage, bookingId);
    }
}

export const supabaseCon = new SupabaseDbConnection();
