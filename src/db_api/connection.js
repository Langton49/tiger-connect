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
                    user_id: data.user_id,
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


}

export const supabaseCon = new SupabaseDbConnection();