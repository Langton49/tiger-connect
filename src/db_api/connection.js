import { createClient } from "@supabase/supabase-js"; // Import the Supabase client library
import { use } from "react";
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
                .select('*') // Select all columns, including rating if it exists
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
                    avatar: userData.avatar || null,
                    bio: userData.bio || null,
                    email: data.user.email,
                    g_number: userData.g_number,
                    verified: userData.verified,
                    rating: userData.rating ?? null, // Include rating, defaulting to null if not present
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
            console.error('Error in listItemsToMarketPlace:', error);
            return { success: false, error: error.message }
        }
    }

    async listServices(name, desc, rate, rateType, category, providerId, availability, image) {
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
        try {
            console.log('Converting data URL to blob...');

            if (!dataURL || typeof dataURL !== 'string') {
                throw new Error('Invalid data URL format');
            }

            const arr = dataURL.split(',');
            if (arr.length < 2) {
                throw new Error('Invalid data URL format: missing comma separator');
            }

            const mimeMatch = arr[0].match(/:(.*?);/);
            if (!mimeMatch) {
                throw new Error('Cannot extract MIME type from data URL');
            }

            const mime = mimeMatch[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            return new Blob([u8arr], { type: mime });
        } catch (error) {
            console.error('Error in dataURLtoBlob:', error);
            throw error;
        }
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

    // Organizations and Events

    // Create a new organization
    async createOrganization(name, type, description, creatorUserId) {
        try {
            console.log('Creating organization with parameters:', { name, type, description, creatorUserId });

            // Create the organization
            const { data: orgData, error: orgError } = await this.supabase
                .from('organizations')
                .insert([{
                    name: name,
                    type: type, // 'admin_faculty', 'official_student', 'general'
                    description: description,
                    verified: false // Organizations need to be verified by an admin
                }])
                .select();

            if (orgError) {
                console.error('Error creating organization:', orgError.message);
                return { success: false, error: orgError.message };
            }

            // Add creator as an admin member of the organization
            const orgId = orgData[0].id;
            const { data: memberData, error: memberError } = await this.supabase
                .from('organization_members')
                .insert([{
                    user_id: creatorUserId,
                    organization_id: orgId,
                    role: 'admin',
                    verified: true // Creator is automatically verified
                }]);

            if (memberError) {
                console.error('Error adding creator as admin:', memberError.message);
                return { success: false, error: memberError.message };
            }

            return { success: true, data: orgData[0] };
        } catch (err) {
            console.error('Unexpected error creating organization:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Get all organizations
    async getOrganizations() {
        try {
            console.log('Fetching organizations...');
            const { data, error } = await this.supabase
                .from('organizations')
                .select('*')
                // Note: Show all organizations, both verified and unverified
                .order('name');

            if (error) {
                console.error('Error fetching organizations:', error.message);
                return { success: false, error: error.message };
            }

            console.log('Fetched organizations:', data?.length || 0, 'results');
            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching organizations:', err);
            return { success: false, error: "Unexpected error while fetching organizations." };
        }
    }

    // Get organizations by type
    async getOrganizationsByType(type) {
        try {
            const { data, error } = await this.supabase
                .from('organizations')
                .select('*')
                .eq('type', type)
                .order('name');

            if (error) {
                console.error('Error fetching organizations by type:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching organizations by type:', err);
            return { success: false, error: "Unexpected error while fetching organizations." };
        }
    }

    // Get organizations a user is a member of
    async getUserOrganizations(userId) {
        try {
            const { data, error } = await this.supabase
                .from('organization_members')
                .select(`
                    organization_id,
                    role,
                    verified,
                    organizations:organization_id (*)
                `)
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching user organizations:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching user organizations:', err);
            return { success: false, error: "Unexpected error while fetching user organizations." };
        }
    }

    // Check if a user can create events (verified member of an organization)
    async canUserCreateEvents(userId) {
        try {
            console.log('Checking if user can create events. User ID:', userId);

            const { data: memberData, error: memberError } = await this.supabase
                .from('organization_members')
                .select(`
                    organization_id,
                    role,
                    verified,
                    organizations:organization_id (
                        id,
                        name,
                        type,
                        verified
                    )
                `)
                .eq('user_id', userId);

            if (memberError) {
                console.error('Error checking user event permissions:', memberError.message);
                return { success: false, error: memberError.message };
            }

            console.log('User organization memberships found:', memberData?.length || 0);
            console.log('Memberships details:', memberData);

            // User can create events if they are a verified member of at least one verified organization
            // For testing purposes, we'll include ALL organizations the user is a member of,
            // but only allow creating if there's at least one verified org with verified membership
            const canCreate = memberData && memberData.length > 0 && memberData.some(membership =>
                membership.verified && membership.organizations && membership.organizations.verified
            );

            // Enhance the response with more details for debugging
            return {
                success: true,
                canCreate,
                organizations: memberData || [],
                message: canCreate
                    ? "User can create events"
                    : memberData?.length > 0
                        ? "User has organizations but none meet verification requirements"
                        : "User has no organizations"
            };
        } catch (err) {
            console.error('Unexpected error checking user event permissions:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Helper to ensure storage bucket exists
    async ensureStorageBucket(bucketName) {
        try {
            console.log(`Checking if storage bucket '${bucketName}' exists...`);

            // Check if bucket exists
            const { data: buckets, error } = await this.supabase.storage.listBuckets();

            if (error) {
                console.error('Error checking storage buckets:', error);
                return false;
            }

            const bucketExists = buckets.some(bucket => bucket.name === bucketName);

            if (!bucketExists) {
                console.log(`Bucket '${bucketName}' not found, attempting to create it...`);

                // Create the bucket with public access
                const { error: createError } = await this.supabase.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
                });

                if (createError) {
                    console.error(`Failed to create bucket '${bucketName}':`, createError);
                    return false;
                }

                console.log(`Bucket '${bucketName}' created successfully`);
            } else {
                console.log(`Bucket '${bucketName}' already exists`);
            }

            return true;
        } catch (error) {
            console.error('Unexpected error in ensureStorageBucket:', error);
            return false;
        }
    }

    // Upload an event image
    async uploadEventImage(base64Image, creatorId) {
        console.log("Starting image upload process for user:", creatorId);

        if (!base64Image) {
            console.error("No image data provided for upload");
            return { success: false, error: "No image data provided" };
        }

        try {
            // Use exactly the same approach as uploadImagesToBucket
            const filePath = `pictures/${creatorId}/${Date.now()}.png`;

            const { error: uploadError } = await this.supabase.storage
                .from('pictures')
                .upload(filePath, this.dataURLtoBlob(base64Image));

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = await this.supabase.storage
                .from('pictures')
                .getPublicUrl(filePath);

            console.log("Image uploaded successfully. Public URL:", publicUrl);

            return { success: true, data: publicUrl };
        } catch (error) {
            console.error("Unexpected error during image upload:", error);
            return { success: false, error: error.message || "Unexpected error during upload" };
        }
    }

    // Create a new event
    async createEvent(title, description, date, location, organizationId, creatorId, imageUrl = null) {
        try {
            console.log('Creating event with parameters:', {
                title,
                date,
                organizationId,
                creatorId,
                hasImage: !!imageUrl
            });

            // Check if the user is a verified member of the organization
            const { data: memberData, error: memberError } = await this.supabase
                .from('organization_members')
                .select('verified, role, organizations(verified)') // Include organization verification status
                .eq('user_id', creatorId)
                .eq('organization_id', organizationId)
                .single();

            // Check user membership verification
            if (memberError || !memberData || !memberData.verified) {
                console.error('User not authorized to create events for this organization (not verified member):',
                    memberError?.message || 'User not verified');
                return {
                    success: false,
                    error: "You must be a verified member of the organization to create events."
                };
            }

            // Check organization verification
            if (!memberData.organizations || !memberData.organizations.verified) {
                console.error('Cannot create event for an unverified organization.');
                return {
                    success: false,
                    error: "Events can only be created for verified organizations."
                };
            }

            // Create the event
            const { data, error } = await this.supabase
                .from('events')
                .insert([{
                    title,
                    description,
                    date,
                    location,
                    organization_id: organizationId,
                    creator_id: creatorId,
                    image_url: imageUrl
                }])
                .select();

            if (error) {
                console.error('Error creating event:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Unexpected error creating event:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Get all events with organization info
    async getEvents() {
        try {
            const { data, error } = await this.supabase
                .from('events')
                .select(`
                    *,
                    organization:organization_id (
                        name,
                        type,
                        verified
                    ),
                    creator:creator_id (
                        first_name,
                        last_name
                    )
                `)
                .order('date');

            if (error) {
                console.error('Error fetching events:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching events:', err);
            return { success: false, error: "Unexpected error while fetching events." };
        }
    }

    // Get events for a specific organization
    async getOrganizationEvents(organizationId) {
        try {
            const { data, error } = await this.supabase
                .from('events')
                .select(`
                    *,
                    creator:creator_id (
                        first_name,
                        last_name
                    )
                `)
                .eq('organization_id', organizationId)
                .order('date');

            if (error) {
                console.error('Error fetching organization events:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching organization events:', err);
            return { success: false, error: "Unexpected error while fetching events." };
        }
    }

    // Request to join an organization
    async joinOrganization(userId, organizationId) {
        try {
            console.log('Requesting to join organization with parameters:', { userId, organizationId });

            // Check if user is already a member
            const { data: existingMembership, error: checkError } = await this.supabase
                .from('organization_members')
                .select('*')
                .eq('user_id', userId)
                .eq('organization_id', organizationId)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking existing membership:', checkError.message);
                return { success: false, error: checkError.message };
            }

            if (existingMembership) {
                return {
                    success: false,
                    error: "You are already a member of this organization"
                };
            }

            // Add the user as a member with pending verification
            const { data, error } = await this.supabase
                .from('organization_members')
                .insert([{
                    user_id: userId,
                    organization_id: organizationId,
                    role: 'member', // Default role
                    verified: false  // Requires approval from admin
                }])
                .select();

            if (error) {
                console.error('Error joining organization:', error.message);
                return { success: false, error: error.message };
            }

            // For notification purposes, get the organization name
            const { data: orgData, error: orgError } = await this.supabase
                .from('organizations')
                .select('name')
                .eq('id', organizationId)
                .single();

            if (!orgError && orgData) {
                // Find admins of the organization to notify them
                const { data: admins, error: adminsError } = await this.supabase
                    .from('organization_members')
                    .select('user_id')
                    .eq('organization_id', organizationId)
                    .eq('role', 'admin');

                if (!adminsError && admins?.length > 0) {
                    // Get user name for notification
                    const { data: userData, error: userError } = await this.supabase
                        .from('user_table')
                        .select('first_name, last_name')
                        .eq('user_id', userId)
                        .single();

                    if (!userError && userData) {
                        const userName = `${userData.first_name} ${userData.last_name}`;

                        // Notify all admins
                        for (const admin of admins) {
                            await this.addNotification(
                                admin.user_id,
                                'organization',
                                'New Member Request',
                                `${userName} has requested to join ${orgData.name}`,
                                organizationId
                            );
                        }
                    }
                }
            }

            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Unexpected error joining organization:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Make a user a system admin
    async makeUserAdmin(userId) {
        try {
            console.log('Setting user as admin:', userId);

            // Update the user_table to add admin flag
            const { data, error } = await this.supabase
                .from('user_table')
                .update({ is_admin: true })
                .eq('user_id', userId)
                .select();

            if (error) {
                console.error('Error updating user as admin:', error.message);
                return { success: false, error: error.message };
            }

            console.log('User set as admin successfully:', data);

            // Return the updated user data
            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Unexpected error making user admin:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Approve an organization (admin only)
    async approveOrganization(organizationId, userId) {
        try {
            // Check if user is an admin
            const { data: userData, error: userError } = await this.supabase
                .from('user_table')
                .select('is_admin')
                .eq('user_id', userId)
                .single();

            if (userError || !userData?.is_admin) {
                console.error('User is not authorized to approve organizations');
                return {
                    success: false,
                    error: "You are not authorized to perform this action"
                };
            }

            // Update the organization to verified status
            const { data, error } = await this.supabase
                .from('organizations')
                .update({ verified: true })
                .eq('id', organizationId)
                .select();

            if (error) {
                console.error('Error approving organization:', error.message);
                return { success: false, error: error.message };
            }

            // Get organization name for notification
            const orgName = data[0].name;

            // Find members of this organization to notify them
            const { data: members, error: membersError } = await this.supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', organizationId);

            if (!membersError && members?.length > 0) {
                // Notify all members
                for (const member of members) {
                    await this.addNotification(
                        member.user_id,
                        'organization',
                        'Organization Approved',
                        `Your organization "${orgName}" has been approved`,
                        organizationId
                    );
                }
            }

            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Unexpected error approving organization:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // Approve a member of an organization (organization admin only)
    async approveOrganizationMember(memberId, organizationId, approverUserId) {
        try {
            // Check if approver is an admin of the organization
            const { data: adminData, error: adminError } = await this.supabase
                .from('organization_members')
                .select('role')
                .eq('user_id', approverUserId)
                .eq('organization_id', organizationId)
                .single();

            if (adminError || adminData?.role !== 'admin') {
                console.error('User is not an admin of this organization');
                return {
                    success: false,
                    error: "You are not authorized to approve members for this organization"
                };
            }

            // Update the member's status to verified
            const { data, error } = await this.supabase
                .from('organization_members')
                .update({ verified: true })
                .eq('user_id', memberId)
                .eq('organization_id', organizationId)
                .select();

            if (error) {
                console.error('Error approving organization member:', error.message);
                return { success: false, error: error.message };
            }

            // Get organization name for notification
            const { data: orgData, error: orgError } = await this.supabase
                .from('organizations')
                .select('name')
                .eq('id', organizationId)
                .single();

            // Notify the member that they've been approved
            if (!orgError && orgData) {
                await this.addNotification(
                    memberId,
                    'organization',
                    'Membership Approved',
                    `Your membership to "${orgData.name}" has been approved`,
                    organizationId
                );
            }

            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Unexpected error approving organization member:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    // ---- New Methods for Admin Panel ----

    // Get all unverified organizations (for system admin)
    async getPendingOrganizations() {
        try {
            console.log('Fetching pending organizations...');
            const { data, error } = await this.supabase
                .from('organizations')
                .select('*')
                .eq('verified', false)
                .order('created_at');

            if (error) {
                console.error('Error fetching pending organizations:', error.message);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error fetching pending orgs:', err);
            return { success: false, error: "Unexpected error." };
        }
    }

    // Get pending members for organizations where a user is admin
    async getPendingMembersForAdmin(adminUserId) {
        try {
            console.log('Fetching pending members for admin:', adminUserId);
            // 1. Find orgs where the user is an admin
            const { data: adminOrgs, error: adminOrgsError } = await this.supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', adminUserId)
                .eq('role', 'admin');

            if (adminOrgsError) throw adminOrgsError;
            if (!adminOrgs || adminOrgs.length === 0) {
                return { success: true, data: { adminOrganizations: [], pendingMembers: [] } }; // No orgs, so no pending members
            }

            const orgIds = adminOrgs.map(org => org.organization_id);

            // 2. Fetch details of these admin organizations
            const { data: adminOrgDetails, error: adminOrgDetailsError } = await this.supabase
                .from('organizations')
                .select('id, name, type')
                .in('id', orgIds);

            if (adminOrgDetailsError) throw adminOrgDetailsError;

            // 3. Fetch pending members for these organizations
            const { data: pendingMembers, error: membersError } = await this.supabase
                .from('organization_members')
                .select(`
                    id,
                    user_id,
                    organization_id,
                    created_at,
                    users:user_id (first_name, last_name),
                    organizations:organization_id (name, type)
                `)
                .in('organization_id', orgIds)
                .eq('verified', false)
                .order('created_at');

            if (membersError) throw membersError;

            return {
                success: true,
                data: {
                    adminOrganizations: adminOrgDetails || [],
                    pendingMembers: pendingMembers || []
                }
            };
        } catch (err) {
            console.error('Error fetching pending members for admin:', err.message);
            return { success: false, error: err.message };
        }
    }
    // ---- End of New Methods ----

    async updatePassword(userId, newPassword) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('Error updating password:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error updating password:', err);
            return { success: false, error: "Unexpected error. Please try again." };
        }
    }

    async updateProfile(user_id, first_name, last_name, bio, avatar) {
        try {
            const { data, error } = await this.supabase.from("user_table")
                .update({
                    first_name: first_name,
                    last_name: last_name,
                    bio: bio,
                    avatar: avatar
                })
                .eq('user_id', user_id)

            if (error) throw new Error(error.message)
            return { success: true, data: {} }
        } catch (error) {
            return { success: false, error: error.message }
        }

    }

    async updateEmail(email) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                email: email
            })

            if (error) throw new Error(error.message)
            return { success: true, data: {} }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    async updateSettings(user_id, settings) {
        try {
            const { data, error } = await this.supabase.from("user_table")
                .update(settings)
                .eq('user_id', user_id)

            if (error) throw new Error(error.message)
            return { success: true, data: {} }
        } catch (error) {
            return { success: false, error: error.message }
        }

    }

    async enableMFA(user_id, email) {
        try {
            const { data, error } = await this.supabase.functions.invoke("generate_code_send_email", {
                body: ({
                    email: email,
                    user_id: user_id
                })
            })
            if (error) throw new Error(error.message)
            return { success: true, data: {} }
        } catch (error) {
            return { success: false, error: error.message }
        }

    }
}

// Create an instance of the class and export it
export const supabaseCon = new SupabaseDbConnection();