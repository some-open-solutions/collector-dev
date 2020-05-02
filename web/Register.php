<?php
/*  Collector (Garcia, Kornell, Kerr, Blake & Haffey)
    A program for running experiments on the web
    Copyright 2012-2016 Mikey Garcia & Nate Kornell


    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License version 3 as published by
    the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>

		Kitten release (2019-20) author: Anthony Haffey (a.haffey@reading.ac.uk)
*/

//require("../headers.php");

header("Access-Control-Allow-Origin: *");

require_once "../oCollector_captcha_keys.php";
require_once "../sqlConnect.php";

require_once "../mailerPassword.php";
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMailer/src/Exception.php';
require '../PHPMailer/src/PHPMailer.php';
require '../PHPMailer/src/SMTP.php';


function generateRandomString($length = 10) {
	return substr(str_shuffle(str_repeat($x='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil($length/strlen($x)) )),1,$length);
}

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

$action 	= $_POST['action'];
if(isset($_POST['location'])){
  $location = $_POST['location'];
}
$email 		= $_POST['email'];
$password = $_POST['password'];

if($email == ""){
  echo "missing email";
  return;
}

function create_experiment($location,$conn,$email){
	$sql = "INSERT INTO `experiments`(`location`) VALUES ('$location');";
	if ($conn->query($sql) === TRUE) {				
		$sql = "INSERT INTO `contributors` (`experiment_id`,`user_id`,`contributor_status`) VALUES(
			(SELECT `experiment_id` FROM `experiments` WHERE `location` = '$location'), 
			(SELECT `user_id` FROM `users` WHERE `email`='$email'),
			('V'));";
		
		if ($conn->query($sql) === TRUE) {
			echo "success";
		} else {
			echo  $conn->error;;
		}		
	} else {
		echo  $conn->error;;
	}	
}


function experiment_exists($location,
													 $conn,
													 $email,
													 $mailer_password,
													 $mailer_user){
	$check_exists_sql = "SELECT * FROM `view_experiment_users` WHERE `location` = '$location'";
	
	$result = $conn->query($check_exists_sql);
	
    
	
	if($result -> num_rows == 0){
		return create_experiment($location,$conn,$email);
	} else {		
  
    $row = mysqli_fetch_array($result);
    $initial_email = $row['email'];

		//check if combination of user and location exists
		$check_exists_sql = "SELECT * FROM `view_experiment_users` WHERE `location` = '$location' AND `email` = '$email'";
		$result = $conn->query($check_exists_sql);
		
		
		if($result -> num_rows == 0){
			$sql = "INSERT INTO `contributors` (`experiment_id`,`user_id`,`contributor_status`) VALUES(
				(SELECT `experiment_id` FROM `experiments` WHERE `location` = '$location'), 
				(SELECT `user_id` FROM `users` WHERE `email`='$email'),
				('u'));";
			
			if ($conn->query($sql) === TRUE) {
				$mail = new PHPMailer(true);                          // Passing `true` enables exceptions
				$mail->SMTPDebug = 0;                                 // Enable verbose debug output
				//$mail->isSMTP();                                    // Set mailer to use SMTP
				$mail->Host = 'ocollector.org';  											// smtp2.example.com, Specify main and backup SMTP servers
				$mail->SMTPAuth = true;                               // Enable SMTP authentication
				$mail->Username = "$mailer_user";											// SMTP username
				$mail->Password = "$mailer_password";                 // SMTP password
				$mail->SMTPSecure = 'tls';
				$mail->SMTPOptions = array(
					'ssl' => array(
							'verify_peer' => false,
							'verify_peer_name' => false,
							'allow_self_signed' => true
					)
				);                            // Enable TLS encryption, `ssl` also accepted
				$mail->Port = 587;                                    // TCP port to connect to
				$mail->setFrom('no-reply@ocollector.org', 'Collector');
				$mail->isHTML(true);                                  // Set email format to HTML
				
				$exploded_url = explode("/",$_SERVER['SERVER_NAME'].$_SERVER['PHP_SELF']);
				array_pop($exploded_url);
				$imploded_url = "https://".implode("/",$exploded_url);
				
				$msg = "Dear " . $initial_email . " <br><br>. $email wants to be a collaborator on your experiment at $location. If you are okay with this, please go to the following link: <br><br> $imploded_url/collaborator.php?email=$email&location=$location";

				// use wordwrap() if lines are longer than 70 characters
				//$msg = wordwrap($msg,70);

				// send email
				$mail->Subject = "Collector: $email wants to collaborate!";
				$mail->Body    = $msg;
				$mail->AltBody = $msg;

				$mail->addAddress($initial_email);     // Add a recipient
				$mail->send();	
				
				return "Your request to be a collaborator has been sent.";
			} else {
				echo  $conn->error;;
			}	
		} else if($row['contributor_status'] == "u"){
      return "Still awaiting confirmation that you are a collaborator. Do contact your colleague who originally created this experiment";
    } else if($row['contributor_status'] == "V"){
      return "You are already registered with this experiment.";
    } else {
      return "error: something has gone wrong with the mysql databases, please contact your admin";
    }
	}
}

function unique_published_id($conn){
	$published_id = generateRandomString(16);
	//check that published_id doesn't already exist
	$sql = "SELECT * FROM `experiment` WHERE `published_id` = '$published_id'";
	$result = $conn->query($sql);
	if($result -> num_rows == 0){
		return $published_id;
	} else {
		unique_published_id($conn);
	}
}


function create_random_code($length){
  $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $charactersLength = strlen($characters);        
  $new_code= '';
  for ($i = 0; $i < $length; $i++) {
    $new_code .= $characters[rand(0, $charactersLength - 1)];
  }
  return $new_code;
}


function email_user($email_type,
                    $email,
                    $email_confirm_code,
										$mailer_user,
										$mailer_password){
	$mail = new PHPMailer(true);                          // Passing `true` enables exceptions
	$mail->SMTPDebug = 0;                                 // Enable verbose debug output
	//$mail->isSMTP();                                    // Set mailer to use SMTP
	$mail->Host = 'ocollector.org';  											// smtp2.example.com, Specify main and backup SMTP servers
	$mail->SMTPAuth = true;                               // Enable SMTP authentication
	$mail->Username = "$mailer_user";											// SMTP username
	$mail->Password = "$mailer_password";                 // SMTP password
	$mail->SMTPSecure = 'tls';
	$mail->SMTPOptions = array(
		'ssl' => array(
				'verify_peer' => false,
				'verify_peer_name' => false,
				'allow_self_signed' => true
		)
	);                            // Enable TLS encryption, `ssl` also accepted
	$mail->Port = 587;                                    // TCP port to connect to
	$mail->setFrom('no-reply@ocollector.org', 'Collector');
	$mail->isHTML(true);                                  // Set email format to HTML
			
	//identify the website this is coming from
	$exploded_url = explode("/",$_SERVER['SERVER_NAME'].$_SERVER['PHP_SELF']);
	array_pop($exploded_url);
	$imploded_url = "https://".implode("/",$exploded_url);

  switch($email_type){		
    case "registration":
      $msg = "Dear $email <br><br>Thank you for registering with Collector hosted by Some Open Solutions. Before you can use your new profile, we need to confirm this is a valid address. Please proceed to the following link to confirm: <br> $imploded_url/confirm.php?email=$email&confirm_code=$email_confirm_code <br>Many thanks, <br>Some Open Solutions";

      // use wordwrap() if lines are longer than 70 characters
      //$msg = wordwrap($msg,70);

      // send email
			$mail->Subject = "Confirmation code for Registering with Collector";
			$mail->Body    = $msg;
			$mail->AltBody = $msg;

			$mail->addAddress($email);     // Add a recipient
			$mail->send();			
      break;
    case "forgot": 
      $msg = "Dear $email \n \nThere has been a request to reset the password for your account. Please go to the following link to set your new password: \n $imploded_url/UpdatePassword.php?email=$email&confirm_code=$email_confirm_code \nMany thanks, \nThe Open-Collector team";

      $msg = wordwrap($msg,70); // use wordwrap() if lines are longer than 70 characters        
      mail($email,"Resetting password with Open-Collector",$msg); // send email
      break;
  }
}


function validate_captcha($captcha_secret, $captcha_response){
	$verifyResponse = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$captcha_secret.'&response='.$captcha_response); 
  
  // Decode json data 
  $responseData = json_decode($verifyResponse); 
   
  // If reCAPTCHA response is valid 
  if($responseData->success){ 
    return true;
  }else{ 
    return false;
  }
}


function insert_row($email,
										$password,
										$conn,
										$captcha_secret,
										$mailer_user,
										$mailer_password){
	
	$salt = create_random_code(20);
	$pepper = create_random_code(20);	
	$prehashed_code = create_random_code(20);
	$hashed_password = password_hash($salt.$password.$pepper, PASSWORD_BCRYPT);
	$hashed_code = password_hash($prehashed_code, PASSWORD_BCRYPT);
	
	$sql = "INSERT INTO `users` (`email`, `password`, `hashed_code`, `salt`,`pepper`,`account_status`) VALUES('$email', '$hashed_password', '$hashed_code','$salt','$pepper','u');";
	if ($conn->query($sql) === TRUE) {			
		if(validate_captcha($captcha_secret, $_POST['g-recaptcha-response'])){
			$success_fail = "fail";  //not really, but need to confirm with e-mail code first
			$return_obj->error_msg = "E-mail not sent. Please contact team @ someopen dot solutions."; 

			email_user( "registration",
									$email,
									$prehashed_code,
									$mailer_user,
									$mailer_password);
			return "You have just received a registration e-mail. Please check your spam box in case it has gone there. You won't be able to proceed until you've clicked on the link in the e-mail.";
			
			
		} else {
			return 'Robot verification failed, please try again.';
		}
	} else {      
		return "Error adding user: " . $conn->error;
	}
}

if($_POST["action"] == "forgot_password"){
  $sql="SELECT * FROM users WHERE email='$email'";
  $result = $conn->query($sql);
	if($result->num_rows == 0){
    echo "You don't appear to have registered on this server";
  } if($result->num_rows > 1){
    echo "You appear to have registered multiple times on this server. Please contact admin";
  } else {
    
    $row = mysqli_fetch_array($result)
    //need to generate a new confirm code
    $prehashed_code = create_random_code(20);
    $hashed_code = password_hash($prehashed_code, PASSWORD_BCRYPT);
    
    $sql = "INSERT INTO `users` (`email`, `hashed_code`) VALUES('$email', '$hashed_code');";
    if ($conn->query($sql) === TRUE) {
      email_user("forgot",
                 $email,
                 $prehashed_code,
                 $mailer_user,
                 $mailer_password);
    }
  }
}

if($_POST["action"] == "unregister") {
  $sql="SELECT * FROM users WHERE email='$email'";
  $result = $conn->query($sql);
	$row = mysqli_fetch_array($result);
  if($result->num_rows > 0){
    if (password_verify($row['salt'].$password.$row['pepper'], $row['password'])){
      $user_id = $row['user_id'];
			echo "Identifying experiments you contribute to:<br>";
      $sql    = "SELECT * FROM `view_experiment_users` WHERE `email`='".$email."';";
      $result = $conn->query($sql);
      
      $exp_counts = array();
      while($row    = mysqli_fetch_array($result)){
        $exp_id = $row['experiment_id'];
        $inner_sql = "SELECT * FROM `view_experiment_users` WHERE `experiment_id` = '$exp_id'";
        $inner_result = $conn->query($inner_sql);
        while($inner_row = mysqli_fetch_array($inner_result)){
          if(isset($exp_counts[$exp_id])){
            $exp_counts[$exp_id]++;
          } else {
            $exp_counts[$exp_id] = 1;
          }
        } 
      }
      foreach($exp_counts as $exp_id => $this_count){
        echo "$exp_counts -> $exp_id -> $this_count<br>";
        if($this_count == 1){
          //delete experiment from experiments
          $sql = "DELETE FROM `experiments` WHERE `experiment_id` = '$exp_id';";
          if ($conn->query($sql) === TRUE) {
            echo "Succesfully deleted an experiment you were the only contributor to<br>";
          } else {
            echo "Error deleting an experiment you were the only contributor to: " . $conn->error;
          }
        } 
        $sql = "DELETE FROM `contributors` WHERE `user_id` = '$user_id';";
        if ($conn->query($sql) === TRUE) {
          echo "Succesfully removed yourself as a contributor to an experiment<br>";
        } else {
          echo "Error removing you as a contributor from an experiment: " . $conn->error;
        }
      }
      $sql = "DELETE FROM `users` WHERE `email` = '$email';";
			if ($conn->query($sql) === TRUE) {
				echo "Succesfully deleted your account";
			} else {
				echo "Error deleting user: " . $conn->error;
			}
		} else {
      echo "Wrong password. Click the <b>Forgot Password</b> to get an e-mail with to create a new one.";
    }
  }
}

//use switch statement instead??
if($_POST["action"] == "register") {
  $sql="SELECT * FROM users WHERE email='$email'";
  $result = $conn->query($sql);
	$row = mysqli_fetch_array($result);
  if($result->num_rows > 0){
		if($row['account_status'] == "V"){
			echo "user already exists";
		} else {
			$sql = "DELETE FROM `users` WHERE `email` = '$email';";
			if ($conn->query($sql) === TRUE) {
			  echo insert_row($email, 
																						$password, 
																						$conn, 
																						$captcha_secret, 	
																						$mailer_user,
																						$mailer_password);
			} else {
				echo "Error deleting old version of the user: " . $conn->error;
			}
		}
  } else {
    echo insert_row($email, 
                    $password, 
                    $conn, 
                    $captcha_secret, 	
                    $mailer_user,
                    $mailer_password);
  }
}



if($_POST['action'] == "unregister_experiment"){
  $sql = "SELECT * FROM users WHERE email='$email'";    
  $result = $conn->query($sql);
	
	if($result->num_rows > 1){
		$return_obj->error_msg = 'Please contact team@someopen.solutions -  there are multiple instances of this e-mail address registered.';				
  } else if($result->num_rows == 1){
    $row = mysqli_fetch_array($result);
    $user_id = $row['user_id'];
    if($row['account_status'] == 'V'){  
      if (password_verify($row['salt'].$password.$row['pepper'], $row['password'])){
				if(isset($_POST['g-recaptcha-response']) && !empty($_POST['g-recaptcha-response'])){
					if(validate_captcha($captcha_secret, $_POST['g-recaptcha-response'])){
            
            
            $sql    = "SELECT * FROM `view_experiment_users` WHERE `location`='".$location."';";
            $result = $conn->query($sql);
            $row    = mysqli_fetch_array($result);
            $exp_id = $row['experiment_id'];
            //delete the experiment if the user is the only collaborator
            if($result->num_rows == 1){
              $sql = "DELETE FROM `experiments` WHERE `experiment_id` = '$exp_id';";
              if ($conn->query($sql) === TRUE) {
                echo "Succesfully deleted an experiment you were the only contributor to<br>";
              } else {
                echo "Error deleting an experiment you were the only contributor to: " . $conn->error;
              }
            }
            
            //delete the user as a collaborator
            $sql = "DELETE FROM `contributors` WHERE `user_id` = '$user_id' AND `experiment_id`='$exp_id';";
            if ($conn->query($sql) === TRUE) {
              echo "Succesfully removed you as a contributor to an experiment<br>";
            } else {
              echo "Error removing you as a contributor from an experiment: " . $conn->error;
            }
          } else {
            echo 'Robot verification failed, please try again.';
          }             
        } else { 
					echo 'Please check on the reCAPTCHA box.';
				}
      } else {
        echo 'Invalid e-mail address and/or password.';
      }						
    } else {
      echo "This account has been locked out. Please check your e-mails for a code to log you back in.";
    }    
  } else {
    echo 'Invalid e-mail address and/or password.';
	}
}



if($_POST["action"] == "update_experiment"){ 
  $sql = "SELECT * FROM users WHERE email='$email'";    
  $result = $conn->query($sql);
	
	if($result->num_rows > 1){
		$return_obj->error_msg = 'Please contact team@someopen.solutions -  there are multiple instances of this e-mail address registered.';				
  } else if($result->num_rows == 1){
    $row = mysqli_fetch_array($result);
    if($row['account_status'] == 'V'){  
      if (password_verify($row['salt'].$password.$row['pepper'], $row['password'])){
				if(isset($_POST['g-recaptcha-response']) && !empty($_POST['g-recaptcha-response'])){
					if(validate_captcha($captcha_secret, $_POST['g-recaptcha-response'])){
					  echo experiment_exists($location,
                                   $conn,
                                   $email,
                                   $mailer_password,
                                   $mailer_user);
          } else {
            echo 'Robot verification failed, please try again.';
          }             
        } else { 
					echo 'Please check on the reCAPTCHA box.';
				}
      } else {
        echo 'Invalid e-mail address and/or password.';
      }						
    } else {
      echo "This account has been locked out. Please check your e-mails for a code to log you back in.";
    }    
  } else {
    echo 'Invalid e-mail address and/or password.';
	}
}
mysqli_close($conn);
?>