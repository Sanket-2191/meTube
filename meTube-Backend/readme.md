
## IMP notes in [./src/middlewares/multer.middleware.js]

### indices are used to optimize searching, based on indexed feild. Indexing is a heavy operation.

```js
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

``` 
express handles error like such, to avoid generic messages we have our **ErrorHandler** class and we throw its instances to our **asynHandler** class which uses
```js 
    Promise.catch(err=>next(err)) 
``` 
to send **err** object to the in-built *Express error-handling middleware* mentioned above..

# 22-03-2025

# POINT TOBE NOTED:
it a good practice to send tokens again with res.data even when we are already sending it with cookie,
because it allows client-side applications (React, Next.js, etc.) to manually store and use the token (e.g., for API requests in headers).

```javascript
return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new APIresponse(200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                }
                , `${loggedInUser.username} logged in successfully✅✅`)
        )
```
## Some frontend frameworks (like React/Next.js) prefer storing tokens in memory (Redux, Context API, etc.) instead of relying on cookies also mobile apps might need to store the token as they can't use cookies well.
```js
 const { accessToken, refreshToken } = response.data;
 localStorage.setItem("accessToken", accessToken);
```
## it also provides easy debuggin when used for postman API testing.


# Issue encountered ...
 When we initialize multer midware globally as we have in our project, it automatically tries to handle any multipart/form-data request, even for routes that don’t use file uploads (like login). 
 #### like when we sent login info through body>form-data in postman.
 Since loginUser expects only text fields, but Multer was looking for files, it ended up processing multipart/form-data without keeping req.body hence we were receiving undefined when trying to access 
```js 
    const {email,password}=req.body
```