
// =================== modules require section ========================
const oracledb = require('oracledb')
const express  = require('express')
const bodyParser = require('body-parser')
const formidable = require('formidable')
const fs = require('fs')
const Cryptr = require('cryptr')
const cookieParser = require('cookie-parser')
const { connectionClass } = require('oracledb')
const { result, isArguments, lowerFirst } = require('lodash')
const { createBrotliDecompress } = require('zlib')
const e = require('express')

// =================== app configuration settings =====================
const app = express()
const cryptr = new Cryptr('myTotalySecretKey')
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.static("public"))
app.set("view engine","ejs")
oracledb.autoCommit = true;

// ===================== custom objects ===============================

var signUpDetails = {
    firstName : "dummy",
    lastName : "dummy",
    username : "dummy",
    password: "dummy",
    cnic : "dummy",
    address: "dummy",
    emailaddress: "dummy",
    phonenumber: "dummy",
    securityquestion: "dummy",
    secuityanswer: "dummy"
}

var productDetails = {
    productName : "dummy",
    productDescription : "dummy",
    productType : "dummy",
    productPrice : 1,
    productPostedBy: "dummy"
}

var productDetailsExternal = {
    productName : "dummy",
    productDescription : "dummy",
    productType : "dummy",
    productPrice : 1,
    productPriceType : "dummy",
    productPostedBy: "dummy"
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbPassword = '***'                             // setting password to the database
const dbUsername = '***'                               // setting username
const dbConnectionString = 'localhost:1521/xe'            // setting connection string

var data = []

const dbConfig = {
    user: dbUsername,
    password: dbPassword,
    connectString: dbConnectionString
}

// ===================== custom query methods ===========================
async function SignUpData(signUpDetails) {

    let connection;
  
    try {
      connection = await oracledb.getConnection(dbConfig);
  
      var result = await connection.execute(
        `INSERT INTO 
          SIGNUP (USERNAME, USER_PASSWORD, EMAIL_ADDRESS, CNIC_NUMBER, FIRST_NAME, LAST_NAME, ADDRESS, QUESTION, ANSWER, PHONE_NUMBER, NEWSLETTER)
          VALUES (:username, :password, :emailaddress, :cnic, :firstname, :lastname, :address, :question, :answer, :phonenumber,'N' )`,
        [signUpDetails.username, signUpDetails.password, signUpDetails.emailaddress, signUpDetails.cnic, signUpDetails.firstName, signUpDetails.lastName, signUpDetails.address, signUpDetails.securityquestion, signUpDetails.secuityanswer,signUpDetails.phonenumber],
        //   `SELECT * FROM SIGNUP`
      )
        result = await connection.execute(
            `SELECT USERNAME, USER_PASSWORD FROM SIGNUP WHERE USERNAME= :username AND USER_PASSWORD= :password`,
            [signUpDetails.username, signUpDetails.password]
        )
        result = await connection.execute(
            `INSERT INTO LOGIN(USERNAME, USER_PASSWORD) VALUES (:username, :password)`,
            [result.rows[0]['USERNAME'], result.rows[0]['USER_PASSWORD']]
        )
    //   console.log(result.rows);
    
  
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.commit();
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
}

async function addProduct(productDetails) {
    let connection;
  
    try {
      connection = await oracledb.getConnection(dbConfig);
  
      var result = await connection.execute(
        ` INSERT INTO
        INTERNALPRODUCTSLIST (PRODUCT_NAME, PRODUCT_DESCRIPTION, PRODUCT_PRICE, PRODUCT_TYPE, POSTED_BY)
        VALUES (:name, :description, :price, :type, :posted)`
        ,
        [productDetails.productName, productDetails.productDescription, productDetails.productPrice, productDetails.productType, productDetails.productPostedBy]
        //   `SELECT * FROM SIGNUP`
      );
    //   console.log(result.rows);
    
  
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.commit();
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
}

async function updateProduct(productDetails, id) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
    
        var result = await connection.execute(
          ` UPDATE
          INTERNALPRODUCTSLIST SET 
          PRODUCT_NAME= :name, 
          PRODUCT_DESCRIPTION= :description, 
          PRODUCT_PRICE= :price,
          PRODUCT_TYPE= :type,
          POSTED_BY= :posted
          WHERE PRODUCT_ID= :id`
          ,
          [productDetails.productName, productDetails.productDescription, productDetails.productPrice, productDetails.productType, productDetails.productPostedBy, id]
          //   `SELECT * FROM SIGNUP`
        );
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
}

async function registerNewCartItem(cart_owner, product_id) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
    
        var result = await connection.execute(
            `SELECT PRODUCT_NAME, PRODUCT_PRICE FROM INTERNALPRODUCTSLIST WHERE PRODUCT_ID = :productId`,
            [product_id]
        )
        result = await connection.execute(
          `INSERT INTO CUSTOMERCART(CART_OWNER, PRODUCT_ID, PRODUCT_NAME, PRODUCT_INDIVIDUAL_PRICE, PRODUCT_QUANTITY, PRODUCT_TOTAL_PRICE)
          VALUES (:cartOwner, :productId, :productName, :individualPrice, 1, :totalPrice) `
          ,
          [cart_owner, product_id, result.rows[0]['PRODUCT_NAME'], result.rows[0]['PRODUCT_PRICE'], result.rows[0]['PRODUCT_PRICE']]
          //   `SELECT * FROM SIGNUP`
        );
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
      console.log('item added to cart');
}

async function updateCartItem(cart_owner, product_id, itemQuantity, individualPrice) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        

        var result = await connection.execute(
            `UPDATE CUSTOMERCART SET
            PRODUCT_QUANTITY = :updateQuantity, PRODUCT_TOTAL_PRICE = :updatedTotalPrice
            WHERE CART_OWNER = :cartOwner AND PRODUCT_ID = :productId`,
            [itemQuantity+1, (itemQuantity+1)*individualPrice, cart_owner, product_id]
        )
        
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
      console.log('item updated in cart');
}

async function cartManipulation(cartOwner, productID, operation) {
    if(operation == 'increment') {
        let connection;

        try {
            connection = await oracledb.getConnection(dbConfig);
            var result = await connection.execute(
                `SELECT PRODUCT_QUANTITY, PRODUCT_INDIVIDUAL_PRICE FROM CUSTOMERCART
                WHERE CART_OWNER = :cart_owner AND PRODUCT_ID = :product_id`,
                [cartOwner, productID]
            )

            result = await connection.execute(
                `UPDATE CUSTOMERCART 
                SET PRODUCT_QUANTITY = :updateQuantity, PRODUCT_TOTAL_PRICE = :updatedTotalPrice
                WHERE CART_OWNER = :cart_owner AND PRODUCT_ID = :product_id`,
                [result.rows[0]['PRODUCT_QUANTITY']+1, result.rows[0]['PRODUCT_INDIVIDUAL_PRICE']*(result.rows[0]['PRODUCT_QUANTITY']+1), cartOwner, productID]
            )
            
        //   console.log(result.rows);
        
        
        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
            try {
                await connection.commit();
                await connection.close();
            } catch (err) {
                console.error(err);
            }
            }
        }
        console.log('item incremented in cart');
    }
    else if(operation == 'decrement') {
        let connection;

        try {
            connection = await oracledb.getConnection(dbConfig);
            var result = await connection.execute(
                `SELECT PRODUCT_QUANTITY, PRODUCT_INDIVIDUAL_PRICE FROM CUSTOMERCART
                WHERE CART_OWNER = :cart_owner AND PRODUCT_ID = :product_id`,
                [cartOwner, productID]
            )
            
            if(result.rows[0]['PRODUCT_QUANTITY']>1) {
                result = await connection.execute(
                    `UPDATE CUSTOMERCART 
                    SET PRODUCT_QUANTITY = :updateQuantity, PRODUCT_TOTAL_PRICE = :updatedTotalPrice
                    WHERE CART_OWNER = :cart_owner AND PRODUCT_ID = :product_id`,
                    [result.rows[0]['PRODUCT_QUANTITY']-1, result.rows[0]['PRODUCT_INDIVIDUAL_PRICE']*(result.rows[0]['PRODUCT_QUANTITY']-1), cartOwner, productID]
                )   
            }
            else {
                result = await connection.execute(
                    `DELETE FROM CUSTOMERCART WHERE CART_OWNER = :cart_owner AND PRODUCT_ID = :product_id`,
                    [cartOwner, productID]
                )
            }
        //   console.log(result.rows);
        
        
        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
            try {
                await connection.commit();
                await connection.close();
            } catch (err) {
                console.error(err);
            }
            }
        }
        console.log('item updated in cart');
    }
}

async function orderConfirm(customerName, orderAmount) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        var d = new Date();
        // console.log(d.getFullYear());
        // console.log(d.getDate());
        // console.log(d.getMonth());
        let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        let date = String(d.getDate())  + "-" +  months[d.getMonth()] + "-" + String(d.getFullYear());
        console.log(date);

        var result = await connection.execute(
            `INSERT INTO ORDERDETAILS (CUSTOMER_NAME, ORDER_AMOUNT, ORDER_DATE, ORDER_STATUS)
            VALUES(:customer, :amount, :dateOrder, :status)`,
            [customerName, orderAmount, date, 'confirm' ]
        )

        result = await connection.execute(
            `SELECT ORDER_ID FROM ORDERDETAILS WHERE CUSTOMER_NAME= :customer AND ORDER_AMOUNT= :amount AND ORDER_DATE= :dateOrder`,
            [customerName, orderAmount, date]
        )

        let order_id = result.rows[0].ORDER_ID
        console.log(order_id);

        var cartInformation = await connection.execute(
            `SELECT * FROM CUSTOMERCART`
        )
        console.log(cartInformation.rows);
        for(let i=0; i<cartInformation.rows.length; i++) {
            var result = await connection.execute(
                `INSERT INTO INTERNALORDERINFORMATION (ORDER_ID, PRODUCT_ID, PRODUCT_NAME, PRODUCT_INDIVIDUAL_PRICE, PRODUCT_QUANTITY, PRODUCT_TOTAL_PRICE)
                VALUES (:order_id, :product_id, :product_name, :product_individual_price, :product_quantity, :product_total_price)`,
                [order_id, cartInformation.rows[i].PRODUCT_ID, cartInformation.rows[i].PRODUCT_NAME, cartInformation.rows[i].PRODUCT_INDIVIDUAL_PRICE, cartInformation.rows[i].PRODUCT_QUANTITY, cartInformation.rows[i].PRODUCT_TOTAL_PRICE]
            )
        }
        
        result = await connection.execute(
            `DELETE FROM CUSTOMERCART WHERE CART_OWNER = :cart_owner`,
            [customerName]
        )
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
      console.log("order created");
}

async function updateOrderStatus(order_id, type) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        if(type == 'complete') {
            var result = await connection.execute(
                `update orderdetails set order_status = :status where order_id = :id`,
                ['completed', order_id]
            )
        }
        else if(type == 'incomplete') {
            var result = await connection.execute(
                `update orderdetails set order_status = :status where order_id = :id`,
                ['confirm', order_id]
            )
        }
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
      console.log("order status updated");
}

async function addExternalProduct(productDetailsExternal) {
    let connection;
  
    try {
      connection = await oracledb.getConnection(dbConfig);
  
      var result = await connection.execute(
        ` INSERT INTO
        EXTERNALPRODUCTS (PRODUCT_NAME, PRODUCT_DESCRIPTION, PRODUCT_PRICE, PRODUCT_TYPE, POSTED_BY, PRODUCT_PRICE_TYPE)
        VALUES (:name, :description, :price, :type, :posted, :priceType)`
        ,
        [productDetailsExternal.productName, productDetailsExternal.productDescription, productDetailsExternal.productPrice, productDetailsExternal.productType, productDetailsExternal.productPostedBy, productDetailsExternal.productPriceType]
        //   `SELECT * FROM SIGNUP`
      );
    //   console.log(result.rows);
    
  
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.commit();
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
}

async function updateExternalProductStatus(request_id, type) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        var result = await connection.execute(
            `update externalproducts set ad_status = :updateAd where product_id = :id`,
            [type, request_id]
        )
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
      console.log("order status updated");
}

async function createBidData(productID, amount, buyerID) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        var result = await connection.execute(
            `select * from bidrecord where product_id = :id and bidder_username = :username`,
            [productID, buyerID]
        )
        if(result.rows.length == 1) {
            result = await connection.execute(
                `update bidrecord set bid_amount = :amount where product_id = :id and bidder_username = :username`,
                [amount, productID, buyerID]
            )
        }
        else {
            result = await connection.execute(
                `insert into bidrecord(product_id, bid_amount, bidder_username) values (:id, :amount, :username)`,  
                [productID, amount, buyerID]
            )
        }
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
}

async function registerNewComplaint(orderId, message) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        var result = await connection.execute(
            `select * from complaintrecord where order_id = :id`,
            [orderId]
        )
        if(result.rows.length == 1) {
            result = await connection.execute(
                `update complaintrecord set complaint_message = :msg, complaint_status = :status, admin_username = :adminID where order_id = :id`,
                [message, 'pending', null, orderId]
            )
        }
        else {
            result = await connection.execute(
                `insert into complaintrecord(order_id, complaint_message, admin_username) values (:id, :message, :setNull)`,  
                [orderId, message, null]
            )
        }
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
}

async function updateComplaintStatus(orderId, status, admin) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        if(status == 'resolved') {
            var result = await connection.execute(
                `update complaintrecord set complaint_status = :status, admin_username = :adminID where order_id = :id`,
                [status, admin, orderId]
            )
        }
        else if(status == 'pending') {
            var result = await connection.execute(
                `update complaintrecord set complaint_status = :status, admin_username = :adminID where order_id = :id`,
                [status, null, orderId]
            )
        }
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
}

async function createRating(productID, userID, rating) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        var result = await connection.execute(
            `select * from internalproductrating where product_id = :id and rating_user = :username`,
            [productID, userID]
        )
        if(result.rows.length == 1) {
            result = await connection.execute(
                `update internalproductrating set rating_value = :ratings where product_id = :id and rating_user = :username`,
                [rating, productID, userID]
            )
        }
        else {
            result = await connection.execute(
                `insert into internalproductrating(product_id, rating_user, rating_value) values (:id, :username, :ratings)`,  
                [productID, userID, rating]
            )
        }

        result = await connection.execute(
            `select avg(rating_value) as AVERAGE_RATING from internalproductrating where product_id = :id`,
            [productID]
        )

        var updateProduct = await connection.execute(
            `update internalproductslist set product_rating = :ratings where product_id = :id`,
            [result.rows[0].AVERAGE_RATING, productID]
        )
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
}

async function registerComment(sellerID, userID, message) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        var result = await connection.execute(
            `select * from commentsseller where account_holder = :sellerID and commentor_account = :userLoggedIn`,
            [sellerID, userID]
        )

        if(result.rows.length == 1) {
            result = await connection.execute(
                `update commentsSeller set comment_message = :message where account_holder = :sellerID and commentor_account = :userLoggedIn`,
                [message, sellerID, userID]
            )
        }
        else {
            result = await connection.execute(
                `insert into commentsSeller(comment_message, account_holder, commentor_account) values (:message, :sellerID, :userID)`,
                [message, sellerID, userID]
            )
        }
        
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
}

async function updateAccountStatus(username, status) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        var result = await connection.execute(
            'update login set user_status = :newStatus where username = :userID',
            [status, username]
        )
      //   console.log(result.rows);
      
    
      } catch (err) {
        console.error(err);
      } finally {
        if (connection) {
          try {
            await connection.commit();
            await connection.close();
          } catch (err) {
            console.error(err);
          }
        }
      }
      
}


app.listen(3000, function() {
    console.log("Server is up and listening at port 3000");
})

//  =================== get methods ======================

app.get('/', function(req, res) {
    res.redirect('/view-shop-product')
})

app.get('/sign-up', function(req, res) {
    res.render('signUpPage.ejs', {data: data})
})

app.post('/check_username', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select * from signup where username = :username',
                [req.body.username],
                {outFormat: oracledb.OBJECT},
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        connection.close()
                        if(result.rows.length == 1) {
                            res.send('taken')
                        }
                    }
                }
            )
        }
    })
})

app.post('/check_email', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select * from signup where email_address = :email',
                [req.body.email],
                {outFormat: oracledb.OBJECT},
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        connection.close()
                        if(result.rows.length == 1) {
                            res.send('taken')
                        }
                    }
                }
            )
        }
    })
})

app.post('/check_cnic', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select * from signup where cnic_number = :cnic',
                [req.body.cnic],
                {outFormat: oracledb.OBJECT},
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        connection.close()
                        if(result.rows.length == 1) {
                            res.send('taken')
                        }
                    }
                }
            )
        }
    })
})

app.get('/login', function(req, res) {
    res.render('login.ejs')
})

app.get('/view-shop-product', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'SELECT * FROM INTERNALPRODUCTSLIST order by product_rating desc',
                [],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                console.log('Connection closed');
                            }
                        }) 
                    }
                    else {
                        console.log(result.rows);
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                console.log('Connection closed After fetching data');
                            }
                        })
                        res.render('customer-level-product.ejs', {data: result.rows}) 
                    }
                }
            )
        }
    })
})

app.get('/view-shop-product/:productID', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select * from internalproductslist where product_id = :id',
                [req.params.productID],
                {
                    outFormat: oracledb.OBJECT
                }, 
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        console.log(result.rows);
                        connection.close()
                        res.render('product-list-details.ejs', {
                            data: result.rows[0]
                        })
                    }
                }
            )
        }
    })
})

app.get('/add-to-cart/:productID', function(req, res){
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            } 
            else {
                connection.execute(
                    'SELECT * FROM CUSTOMERCART WHERE CART_OWNER = :owner_id AND PRODUCT_ID= :product',
                    [req.cookies['userAuthToken'], req.params.productID],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("Connection Closed incase of error");
                                }
                            })
                        }
                        else {
                            if(result.rows.length == 1) {
                                console.log("Item found in cart");
                                updateCartItem(req.cookies['userAuthToken'], req.params.productID, result.rows[0]['PRODUCT_QUANTITY'], result.rows[0]['PRODUCT_INDIVIDUAL_PRICE'])
                            }
                            else {
                                console.log("Item is not present in cart");
                                registerNewCartItem(req.cookies['userAuthToken'], req.params.productID) 
                            }
                            connection.close(function(err) {
                                if(err) {
                                    // updateCurrentCartItem()
                                    console.log(err);
                                }
                                else {
                                    console.log("Connection closed safely");
                                }
                            })
                            res.redirect('/view-my-cart')
                        }
                    }
                )
            }
        })
    }
})


app.get('/view-my-cart', function(req, res) {
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'SELECT * FROM CUSTOMERCART WHERE CART_OWNER= :cartOwner',
                    [req.cookies['userAuthToken']],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log('Connection closed');
                                }
                            });
                        }
                        else {
                            connection.close(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log('Connection closed safely');
                                }
                            })
                            let totalBill=0;
                            result.rows.forEach(function(row) {
                                totalBill += row['PRODUCT_TOTAL_PRICE']
                            })
                            res.render('view-cart.ejs', {
                                data: result.rows, totalBill: totalBill
                            })
                        }
                    }
                )
            }
        })
    }
})

app.get('/view-my-cart/increment-item/:productID', function(req, res) {
    if(req.cookies['userAuthToken'] == null ){
        res.redirect('/login')
    }
    else {
        cartManipulation(req.cookies['userAuthToken'], req.params.productID, 'increment')
        res.redirect('/view-my-cart')
    }
})

app.get('/view-my-cart/decrement-item/:productID', function(req, res) {
    if(req.cookies['userAuthToken'] == null ){
        res.redirect('/login')
    }
    else {
        cartManipulation(req.cookies['userAuthToken'], req.params.productID, 'decrement')
        res.redirect('/view-my-cart')
    }
})

app.get('/proceed-to-checkout', function(req, res) {
    if(req.cookies['userAuthToken'] == null ) {
        res.redirect('/login')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            } 
            else {
                connection.execute(
                    'SELECT * FROM CUSTOMERCART WHERE CART_OWNER = :cart_owner',
                    [req.cookies['userAuthToken']],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            connection.execute(
                                'SELECT EMAIL_ADDRESS, FIRST_NAME, LAST_NAME, ADDRESS, PHONE_NUMBER FROM SIGNUP WHERE USERNAME= :cart_owner',
                                [req.cookies['userAuthToken']],
                                {
                                    outFormat: oracledb.OBJECT
                                },
                                function(err, resultUser) {
                                    if(err) {
                                        console.log(err);
                                    }
                                    else {
                                        connection.close(function(err) {
                                            if(err) {
                                                console.log(err);
                                            }
                                            else {
                                                console.log('connection closed after fetching complete records');
                                            }
                                        })
                                    }
                                    let totalBill = 0;
                                    for(let i=0; i<result.rows.length; i++) {
                                        totalBill += result.rows[i].PRODUCT_TOTAL_PRICE
                                    }
                                    res.render('checkout-form.ejs', {
                                        orderData: result.rows, totalBill: totalBill, customerResult: resultUser.rows[0]
                                    })
                                }
                            )
                        }
                    }
                )
            }
        })
    }
})

app.post('/order-confirmation/:billAmount', function(req, res){
    if(req.cookies['userAuthToken'] == null ) {
        res.redirect('/login')
    }
    else {
        orderConfirm(req.cookies['userAuthToken'], req.params.billAmount)
        res.render('order-placed-message.ejs')
        // res.redirect('')
    }
    
})

app.get('/view-my-orders', function(req, res) {
    if(req.cookies['userAuthToken'] == null ) {
        res.redirect('/login')
    }
    else {
        res.redirect('/view-my-orders/' + req.cookies['userAuthToken'])
    }
})

app.get('/view-my-orders/:userID', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select * from orderdetails where customer_name = :customer',
                [req.params.userID],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        // console.log(result.rows);
                        connection.close();
                        res.render('order-history.ejs', {orderData: result.rows})
                    }
                }
            )
        }
    })
})

app.get('/view-my-orders/:userID/:orderID', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select * from internalOrderinformation natural join orderdetails where order_id = :oid',
                [req.params.orderID],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        // console.log(result.rows);
                        connection.close();
                        res.render('order-history-details.ejs', {orderData: result.rows})
                    }
                }
            )
        }
    })
})

app.post('/rate-product/:productID', function(req, res) {
    // console.log(req.body);
    createRating(req.params.productID, req.cookies['userAuthToken'], req.body.ratings)
    res.redirect('/view-shop-product/' + req.params.productID)
})

app.get('/register-complaint/:orderID', function(req, res) {
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        res.render('complaint-form.ejs', {
            orderID: req.params.orderID
        })
    }
})

app.get('/view-external-products', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select externalProducts.*, signup.First_Name, signup.last_name from externalproducts inner join signup on externalproducts.posted_by = signup.username where ad_status = :status',
                ['approved'],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                console.log('Connection closed');
                            }
                        }) 
                    }
                    else {
                        console.log(result.rows);
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                console.log('Connection closed After fetching data');
                            }
                        })
                        res.render('customer-level-product-external.ejs', {data: result.rows, userID: req.cookies['userAuthToken']}) 
                    }
                }
            )
        }
    })
})

app.get('/seller', function(req, res) {
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'select * from externalproducts where posted_by = :id',
                    [req.cookies['userAuthToken']],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close()
                        }
                        else {
                            res.render('seller-page.ejs', { data: result.rows })
                        }
                    }
                )
            }
        })
    }
})

app.get('/seller/post-new-product', function(req, res) {
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        res.render('seller-new-product.ejs', {loginID : req.cookies['userAuthToken']})
    }
})

app.get('/create-bid/:productID', function(req, res) {
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'select * from externalproducts where product_id = :id',
                    [req.params.productID],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close()
                        }
                        else {
                            connection.close()
                            console.log(result.rows);
                            console.log(req.cookies['userAuthToken']);
                            if(result.rows[0].POSTED_BY == req.cookies['userAuthToken']) {
                                res.send('You can not bid on your own product')
                            }
                            else {
                                res.render('customer-bid-form.ejs', {
                                    productData: result.rows[0], loginID: req.cookies['userAuthToken']
                                })
                            }

                        }
                    }

                )
            }
        })
    }
})

app.get('/view-bid-details/:productID', function(req, res) {
    if(req.cookies['userAuthToken']  == null) {
        res.redirect('/login')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    `select bidrecord.product_id, bidrecord.bid_amount, signup.email_address, signup.first_name, signup.last_name, signup.phone_number from bidrecord inner join signup on bidder_username = username where product_id = :id`,
                    [req.params.productID],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close()
                        }
                        else {
                            connection.close()
                            res.render('bid-details.ejs', {
                                data: result.rows
                            })
                        }
                    }
                )
            }
        })
    }
})

app.get('/view-my-complaints', function(req, res) {
    if(req.cookies['userAuthToken'] == null) {
        res.redirect('/login')
    }
    else {
        res.redirect('/view-my-complaints/'+req.cookies['userAuthToken'])
    }
})

app.get('/view-my-complaints/:userID', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                `select order_id, complaint_message, admin_username, phone_number, email_address, first_name, last_name, complaint_status from complaintrecord natural join (select * from signup inner join orderdetails on customer_name = username) where username = :userID`,
                [req.params.userID],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close()
                    }
                    else {
                        connection.close()
                        res.render('complaints-page-user.ejs', {
                            data: result.rows
                        })
                    }
                } 
            )
        }
    })
    
})

app.get('/view-profile-seller/:sellerUsername', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'select comment_message, commentor.FIRST_NAME, commentor.LAST_NAME from signup commentor inner join commentsSeller on commentor.username = commentor_account where account_holder = :accountID',
                [req.params.sellerUsername],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close()
                        console.log(err);
                    }
                    else {
                        
                        console.log(result.rows);
                        connection.execute(
                            'select first_name, last_name, phone_number, email_address from signup where username = :username',
                            [req.params.sellerUsername],
                            {
                                outFormat: oracledb.OBJECT
                            },
                            function(err, sellerData) {
                                if(err) {
                                    connection.close()
                                }
                                else {
                                    connection.close()
                                    console.log(sellerData.rows[0]);
                                    res.render('seller-profile.ejs', {
                                        loginID: req.cookies['userAuthToken'],
                                        sellerID: req.params.sellerUsername,
                                        comments: result.rows,
                                        sellerInfo: sellerData.rows[0]
                                    })
                                }
                            }
                        )
                        
                    }
                }
            )
            
        }
    })
})

// //  =================== post methods ======================
app.post('/sign-up', function(req,res) {
    
    signUpDetails.firstName = req.body.firstname
    signUpDetails.lastName = req.body.lastname
    signUpDetails.username = req.body.username
    signUpDetails.password = cryptr.encrypt(req.body.password)
    // signUpDetails.password = req.body.password
    signUpDetails.phonenumber = req.body.contact
    signUpDetails.emailaddress = req.body.emailaddress
    signUpDetails.cnic = req.body.cnic
    signUpDetails.address = req.body.address
    // var securityQuestion = ""
    if(req.body.securityQuestion === 'mothername') {
        signUpDetails.securityquestion = "What is/was your Mother Name?"
    }
    else if(req.body.securityQuestion === 'petname') {
        signUpDetails.securityquestion = "What is the name of your pet?"
    }
    else if(req.body.securityQuestion === 'favoritecolor') {
      signUpDetails.securityquestion = "What is your favorite color?"
    }
    // console.log(req.body.securityQuestion);
    signUpDetails.secuityanswer = req.body.answer
    SignUpData(signUpDetails)
    res.redirect("/login")
})

app.post('/login', function(req, res) {
    var data = []
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err)
            return
        }
        connection.execute(
            // 'INSERT INTO LOGIN(USERNAME, USER_PASSWORD) VALUES (:username, :password)',
            // [req.body.uName, req.body.uPassword],
            
            // 'SELECT * FROM LOGIN WHERE USERNAME = :username AND USER_PASSWORD = :password',
            // [req.body.uName, req.body.uPassword],
            'SELECT * FROM LOGIN WHERE USERNAME = :username',
            [req.body.uName],
            {
                outFormat: oracledb.OBJECT
            },
            function(err, result) {
                if(err) {
                    connection.close(function(err) {
                        if(err) {
                            console.log(err)
                        }
                        else {
                            console.log('connection closed')
                        }
                    })
                }
                // cryptr.decrypt(result.rows[0]['USER_PASSWORD'])
                // console.log(result.rows)
                
                connection.close(function(err) {
                    if(err) {
                        console.log(err)
                    }
                    else {
                        console.log('connection closed')
                    }
                })
                if(result.rows.length > 0) {
                    if(req.body.uPassword === cryptr.decrypt(result.rows[0]['USER_PASSWORD'])) {
                        res.cookie('userAuthToken', result.rows[0]['USERNAME'])
                        // res.redirect('/view-shop-product')
                        if(result.rows[0]['user_status']=='active' )
                        {
                             res.cookie('userAuthToken', result.rows[0]['USERNAME'])
                            res.redirect('/view-shop-product')
                        }
                        else{
                            res.render('incorrect-login.ejs')
                        }
                    }
                    
                }
                else {
                    res.redirect('/login')
                }
            }
        )
    })
    
})

app.post('/seller/post-new-product', function(req, res) {
    productDetailsExternal.productName = req.body.productName
    productDetailsExternal.productDescription = req.body.productDescription
    productDetailsExternal.productType = req.body.productType
    productDetailsExternal.productPrice = req.body.productPrice
    productDetailsExternal.productPriceType = req.body.productPriceType
    productDetailsExternal.productPostedBy = req.body.productPostedBy
    addExternalProduct(productDetailsExternal)
    res.redirect('/seller')
})

app.post('/create-bid/:productID', function(req, res) {
    console.log(req.body);
    createBidData(req.params.productID, req.body.productBidPrice, req.body.buyerUsername)
    res.redirect("/view-external-products")
})

app.post('/register-complaint/:orderID', function(req, res) {
    registerNewComplaint(req.params.orderID, req.body.message)
    res.redirect('/view-my-orders')
})

app.post('/view-profile-seller/:sellerUsername', function(req, res) {
    registerComment(req.params.sellerUsername, req.body.commentorID, req.body.commentMessage)
    res.redirect('/view-profile-seller/'+req.params.sellerUsername)
})

//              ADMIN LEVEL

app.get('/admin', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.render('admin-login.ejs')
    }
    else {
        res.redirect('/admin/home')
    }
})

app.get('/admin/home', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        res.render('adminHome.ejs')
    }
})

app.get('/admin/add-new-product', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        res.render('add-product.ejs', {accountID: req.cookies['adminAuthToken']})
    }
})

app.get('/admin/view-products', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'SELECT * FROM INTERNALPRODUCTSLIST',
                    [],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log('Connection closed');
                                }
                            }) 
                        }
                        else {
                            console.log(result.rows);
                            connection.close(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log('Connection closed After fetching data');
                                }
                            })
                            res.render('product-list.ejs', {data: result.rows}) 
                        }
                    }
                )
            }
        })
    }
})

app.get('/admin/add-new-product/:productID/remove', function(req, res){
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'DELETE FROM INTERNALPRODUCTSLIST WHERE PRODUCT_ID= :id',
                [req.params.productID],
                function(err) {
                    if(err) {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log('Connection closed');
                            }
                        })
                    }
                    else {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log('Connection closed after removal');
                            }
                        })
                        res.redirect('/admin/view-products')
                    }
                } 
            )
        }
    })
})


app.get('/admin/add-new-product/:productID/edit', function(req, res){
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'SELECT * FROM INTERNALPRODUCTSLIST WHERE PRODUCT_ID= :id',
                [req.params.productID],
                function(err, result) {
                    if(err) {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log('Connection closed');
                            }
                        })
                    }
                    else {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log('Connection closed after fetching specific product');
                            }
                        })
                        res.render('product-edit-page.ejs', {
                            productName: result.rows[0]['PRODUCT_NAME'],
                            productDescription: result.rows[0]['PRODUCT_DESCRIPTION'],
                            productType: result.rows[0]['PRODUCT_TYPE'],
                            accountID: req.cookies['adminAuthToken'],
                            productPrice: result.rows[0]['PRODUCT_PRICE']
                        })
                    }
                } 
            )
        }
    })
})

app.get('/admin/manage-orders', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'SELECT * FROM ORDERDETAILS',
                    [],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close()
                        }
                        else {
                            connection.close()
                        }
                        console.log(result.rows);
                        res.render('admin-manage-orders.ejs', {
                            data: result.rows
                        })
                    }
                )
            }
        })
        
    }
})

app.get('/admin/manage-orders/:orderID/:username', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'SELECT * FROM INTERNALORDERINFORMATION WHERE ORDER_ID = :order_id',
                    [req.params.orderID],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close();
                            console.log("Connection closed in case of error while fetching specific order information");
                        }
                        else {
                            connection.execute(
                                `select userData.username, userData.first_name, userData.last_name, userData.phone_number, userData.address
                                from signup userData
                                inner join orderDetails 
                                on orderdetails.customer_name = userData.username where userData.username = :userID`,
                                [req.params.username],
                                {
                                    outFormat: oracledb.OBJECT
                                },
                                function(err, resultCustomer) {
                                    if(err) {
                                        connection.close()
                                    }
                                    else {
                                        connection.close()
                                        console.log(resultCustomer.rows);
                                        res.render('admin-manage-orders-details.ejs', {
                                            data: result.rows, customerData: resultCustomer.rows
                                        })
                                    }
                                }
                            )
                            
                        }
                    }
                )
            }
        })
    }
})

app.get('/admin/view-external-product-request', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection) {
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'select * from externalproducts',
                    [],
                    {
                        outFormat: oracledb.OBJECT
                    },
                    function(err, result) {
                        if(err) {
                            connection.close()
                        }
                        else {
                            connection.close()
                            res.render('external-requests.ejs', {data: result.rows});
                        }
                    }
                )
            }
        })
    }
})

app.get('/admin/view-complaints', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        oracledb.getConnection(dbConfig, function(err, connection){
            if(err) {
                console.log(err);
            }
            else {
                connection.execute(
                    'select order_id, complaint_message, admin_username, phone_number, email_address, first_name, last_name, complaint_status from complaintrecord natural join (select * from signup inner join orderdetails on customer_name = username)',
                    [],
                    {
                        outFormat: oracledb.OBJECT
                    }, function(err, result) {
                        if(err) {
                            connection.close()
                        }
                        else {
                            connection.close()
                            res.render('admin-complaints.ejs', {
                                data: result.rows
                            })
                        }
                    }
                )
            }
        })
        
    }
})

app.get('/admin/manage-users', function(req, res) {
    // data = []
    // data.length = 0;
    var data = []
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err)
            return
        }
        connection.execute(
            'select username, first_name, last_name, email_address, phone_number, user_status from signup natural join login',
            [],
            {
                outFormat: oracledb.OBJECT
            },
            function(err, result) {
                  if(err) {
                      connection.close(function(err) {
                          if(err) {
                            console.log(err)
                          } else {
                            console.log('Connection closed')
                          }
                      })
                  }
                  console.log("Query executed successfully")
                  // console.log(cryptr.decrypt(result.rows[0]['USER_PASSWORD']))
                  connection.close(function(err) {
                      if(err) {
                          console.log(err)
                      } else {
                          console.log('Connection closed')
                      }
                  })
                  res.render('accounts.ejs', {
                      data: result.rows
                  })
            }
        )
    })
})

app.get('/admin/manage-accounts/block-account/:username', function(req, res) {
    updateAccountStatus(req.params.username, 'blocked')
    res.redirect('/admin/manage-users')
})

app.get('/admin/manage-accounts/unblock-account/:username', function(req, res) {
    updateAccountStatus(req.params.username, 'active')
    res.redirect('/admin/manage-users')
})

app.get('/admin/logout', function(req, res) {
    res.clearCookie('adminAuthToken')
    res.redirect('/admin')
})

app.get('/logout', function(req, res) {
    res.clearCookie('userAuthToken')
    res.redirect('/login')
})
// ========================================================================================================

app.post('/admin', function(req, res) {
    oracledb.getConnection(dbConfig, function(err, connection) {
        if(err) {
            console.log(err);
        }
        else {
            connection.execute(
                'SELECT * FROM ADMIN_ACCOUNTS WHERE ADMIN_USERNAME= :admin_username AND ADMIN_PASSWORD= :admin_password',
                [req.body.adminUsername, req.body.adminPassword],
                {
                    outFormat: oracledb.OBJECT
                },
                function(err, result) {
                    if(err) {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                               
                                console.log('Connection closed');
                            }
                        })
                    }
                    if(result.rows.length == 1) {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                res.cookie('adminAuthToken', req.body.adminUsername)
                                // console.log(req.body.adminUsername)
                                res.redirect('/admin/home')
                                console.log('Connection Closed');
                            }
                        })
                    }
                    else {
                        connection.close(function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                console.log('Connection Closed');
                            }
                        })
                    }
                }
            )
        }
    })
}) 

app.post('/admin/add-new-product', function(req, res) {
    productDetails.productName = req.body.productName
    productDetails.productDescription = req.body.productDescription
    productDetails.productType = req.body.productType
    productDetails.productPrice = req.body.productPrice
    productDetails.productPostedBy = req.body.productPostedBy
    addProduct(productDetails)
    res.redirect('/admin/view-products')
})

app.post('/admin/add-new-product/:productID/edit', function(req, res) {
    productDetails.productName = req.body.productName
    productDetails.productDescription = req.body.productDescription
    productDetails.productType = req.body.productType
    productDetails.productPrice = req.body.productPrice
    productDetails.productPostedBy = req.body.productPostedBy
    updateProduct(productDetails, req.params.productID)
    res.redirect('/admin/view-products')
})

app.post('/admin/mark-as-complete/:orderID', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        updateOrderStatus(req.params.orderID, 'complete')
        res.redirect('/admin/manage-orders')
    }
})

app.post('/admin/mark-as-incomplete/:orderID', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        updateOrderStatus(req.params.orderID, 'incomplete')
        res.redirect('/admin/manage-orders')
    }
})

app.post('/admin/approve-order/:requestID', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        updateExternalProductStatus(req.params.requestID, 'approved')
        res.redirect('/admin/view-external-product-request')
    }
})

app.post('/admin/disapprove-order/:requestID', function(req, res) {
    if(req.cookies['adminAuthToken'] == null) {
        res.redirect('/admin')
    }
    else {
        updateExternalProductStatus(req.params.requestID, 'pending approval')
        res.redirect('/admin/view-external-product-request')
    }
})

app.post('/admin/mark-complaint-as-complete/:orderID', function(req, res) {
    updateComplaintStatus(req.params.orderID, 'resolved', req.cookies['adminAuthToken'])
    res.redirect('/admin/view-complaints')
})

app.post('/admin/mark-complaint-as-incomplete/:orderID', function(req, res) {
    updateComplaintStatus(req.params.orderID, 'pending', req.cookies['adminAuthToken'])
    res.redirect('/admin/view-complaints')
})

app.get('*', function(req, res) {
    res.render('error404.ejs')
})