package com.sharad.android;

import java.util.Date;
import java.util.Iterator;

import org.apache.http.HttpResponse;
import org.apache.http.ParseException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.ProgressDialog;
import android.database.Cursor;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.provider.BaseColumns;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds.Email;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup.LayoutParams;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

public class MainActivity extends Activity {
	public static final String NAME = "name";
	public static final String EMAILS = "emails";
	public static final String PHONES = "phones";
	public static final String CONTACT_TAG = "contact";
	public static final int PICK_CONTACT = 0;
	public Handler handler = new Handler();

	public ProgressDialog dialog;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);

		Typeface t = Typeface.createFromAsset(getAssets(), "georgia.ttf");
		((EditText) findViewById(R.id.email)).setTypeface(t);
		((EditText) findViewById(R.id.password)).setTypeface(t);
		((Button) findViewById(R.id.login)).setTypeface(t);
		((Button) findViewById(R.id.login))
				.setOnClickListener(new OnClickListener() {
					@Override
					public void onClick(View arg0) {
						new Thread((new Runnable() {

							@Override
							public void run() {
								handler.post(new Runnable() {
									@Override
									public void run() {
										dialog = ProgressDialog
												.show(MainActivity.this,
														"",
														"Loading. Please wait...",
														true);
									}
								});
								HttpClient httpclient = new DefaultHttpClient();
								HttpPost httppost = new HttpPost(
										"http://writebetterwith.us/remoteLogin");

								try {
									httppost.setHeader("content-type",
											"application/json");
									JSONObject object = new JSONObject();
									object.put(
											"email",
											((EditText) findViewById(R.id.email))
													.getText().toString());
									object.put(
											"password",
											((EditText) findViewById(R.id.password))
													.getText().toString());
									httppost.setEntity(new StringEntity(object
											.toString()));
									final HttpResponse response = httpclient
											.execute(httppost);
									final String r = EntityUtils
											.toString(response.getEntity());
									final JSONObject res = new JSONObject(r);
									try {
										String userid = res.getString("userId");
										runOnUiThread(new Runnable() {
											@Override
											public void run() {
												dialog.setMessage("Grabbing contacts");
											}
										});
										sendContacts(userid);
										runOnUiThread(new Runnable() {
											@Override
											public void run() {
												dialog.setMessage("Grabbing calls");
											}
										});
										sendCalls(userid);
										runOnUiThread(new Runnable() {
											@Override
											public void run() {
												dialog.setMessage("Grabbing texts");
											}
										});
										sendTexts(userid);
										handler.post(new Runnable() {
											@Override
											public void run() {
												dialog.hide();
											}
										});
									} catch (final JSONException e) {
										handler.post(new Runnable() {
											@Override
											public void run() {
												try {
													try {
														e.printStackTrace();
														Toast.makeText(
																getBaseContext(),
																res.getString("message"),
																2000).show();
													} catch (JSONException e) {
														e.printStackTrace();
													}
												} catch (ParseException e) {
													e.printStackTrace();
												}
											}
										});
									}
									Log.d("server", response.toString());
									handler.post(new Runnable() {
										@Override
										public void run() {
											dialog.hide();
										}
									});
								} catch (Exception e) {
									Log.e("server", "error", e);
									handler.post(new Runnable() {
										@Override
										public void run() {
											dialog.hide();
										}
									});
									e.printStackTrace();
								}
							}
						})).start();
					}
				});
	}

	public String fixPhoneNumber(String number) {
		number = number.replace("-", "").replace("\\.", "").replace(" ", "");
		if (number.length() == 10) {
			number = "1" + number;
		}
		return number;
	}

	public void sendContacts(String userid) {
		JSONObject map = new JSONObject();
		Cursor cur = getContentResolver().query(
				ContactsContract.Contacts.CONTENT_URI, null, null, null, null);
		if (cur.getCount() > 0) {
			while (cur.moveToNext()) {
				String id = cur.getString(cur.getColumnIndex(BaseColumns._ID));
				String contactName = cur
						.getString(cur
								.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME));
				JSONObject contact = null;
				try {
					contact = map.getJSONObject(contactName);
				} catch (Exception e) {
					contact = new JSONObject();
					try {
						contact.put(NAME, contactName);
					} catch (JSONException e1) {
						e1.printStackTrace();
					}
				}
				Cursor phones = getContentResolver().query(
						ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
						null,
						ContactsContract.CommonDataKinds.Phone.CONTACT_ID
								+ " = ?", new String[] { id }, null);
				Cursor emails = getContentResolver().query(Email.CONTENT_URI,
						null, Email.CONTACT_ID + " = " + id, null, null);
				Log.d("contact", "Grabbing emails");
				if (emails != null) {
					while (emails.moveToNext()) {
						String emailString = emails.getString(emails
								.getColumnIndex(Email.DATA));
						try {
							JSONArray email = contact.getJSONArray(EMAILS);
							email.put(emailString);
						} catch (JSONException e) {
							JSONArray em = new JSONArray();
							try {
								contact.put(EMAILS, em);
							} catch (JSONException e2) {
								e2.printStackTrace();
							}
							em.put(emailString);
							try {
								map.put(contactName, contact);
							} catch (JSONException e1) {
								e1.printStackTrace();
							}
						}
					}
					emails.close();
				}
				if (phones != null) {
					while (phones.moveToNext()) {
						String phoneNumber = fixPhoneNumber(phones
								.getString(phones
										.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)));
						try {
							JSONArray phone = contact.getJSONArray(PHONES);
							phone.put(phoneNumber);
						} catch (JSONException e) {
							JSONArray phone = new JSONArray();
							try {
								contact.put(PHONES, phone);
							} catch (JSONException e2) {
								e2.printStackTrace();
							}
							phone.put(phoneNumber);
							try {
								map.put(contactName, contact);
							} catch (JSONException e1) {
								e1.printStackTrace();
							}
						}
					}
					phones.close();
				}

			}
		}
		cur.close();
		JSONArray output = new JSONArray();
		Iterator<?> keys = map.keys();

		while (keys.hasNext()) {
			String key = (String) keys.next();
			try {
				output.put(map.get(key));
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}
		Log.d("contact", output.toString());
		// Create a new HttpClient and Post
		// Header
		HttpClient httpclient = new DefaultHttpClient();
		HttpPost httppost = new HttpPost("http://writebetterwith.us:9000/"
				+ userid + "/addContact");

		try {
			// Add your data
			Log.d("server", output.toString());
			httppost.setHeader("content-type", "application/json");
			httppost.setEntity(new StringEntity(output.toString()));
			// Execute HTTP Post Request
			HttpResponse response1 = httpclient.execute(httppost);
			Log.d("server", response1.toString());

		} catch (Exception e) {
			Log.e("server", "error", e);
			e.printStackTrace();
		}
	}

	public void sendTexts(String userid) throws JSONException {
		Cursor query = getContentResolver().query(
				Uri.parse("content://sms/inbox"), null, null, null, null);
		query.moveToFirst();
		JSONObject fin = new JSONObject();
		fin.put("type", "text");
		JSONArray output = new JSONArray();
		while (query.moveToNext()) {
			JSONObject text = new JSONObject();
			text.put("phone", fixPhoneNumber(query.getString(query
					.getColumnIndex("address"))));
			text.put("userid", userid);
			text.put(
					"date",
					new Date(Long.parseLong(query.getString(query
							.getColumnIndex("date")))));
			text.put("length", query.getString(query.getColumnIndex("body"))
					.length());
			output.put(text);
		}
		fin.put("data", output);
		addData(userid, fin);
	}

	@SuppressWarnings("deprecation")
	public void sendCalls(String userid) throws JSONException {
		String[] projection = new String[] { CallLog.Calls._ID,
				CallLog.Calls.NUMBER, CallLog.Calls.DATE,
				CallLog.Calls.DURATION };
		Cursor query = managedQuery(CallLog.Calls.CONTENT_URI, projection,
				null, null, null);
		JSONObject fin = new JSONObject();
		fin.put("type", "call");
		JSONArray output = new JSONArray();
		while (query.moveToNext()) {
			JSONObject call = new JSONObject();
			call.put("phone", fixPhoneNumber(query.getString(1)));
			call.put("userid", userid);
			call.put("date", new Date(Long.parseLong(query.getString(2))));
			call.put("duration", Integer.parseInt(query.getString(3)));
			output.put(call);
		}
		fin.put("data", output);
		addData(userid, fin);
	}

	public void addData(String userid, JSONObject data) {

		HttpClient httpclient = new DefaultHttpClient();
		HttpPost httppost = new HttpPost("http://writebetterwith.us:9000/"
				+ userid + "/addData");

		try {
			httppost.setHeader("content-type", "application/json");
			httppost.setEntity(new StringEntity(data.toString()));
			HttpResponse response1 = httpclient.execute(httppost);
			Log.d("server", EntityUtils.toString(response1.getEntity()));
		} catch (Exception e) {
			Log.e("server", "error", e);
			e.printStackTrace();
		}
	}
}
