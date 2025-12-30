# n8n-nodes-smartemailing-contact-importer

This n8n community node package provides:

1. **Smartemailing Contact Importer** - Import contacts into Smartemailing contact lists
2. **Facebook Lead Ads Trigger** - Receive real-time leads from Facebook Lead Ads (supports multiple forms)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

---

# Facebook Lead Ads Multi-Form Trigger

The Facebook Lead Ads Trigger node receives real-time webhook notifications when new leads are submitted through Facebook Lead Ads. Unlike the built-in n8n trigger which only supports one form per Facebook App, this custom trigger can handle **multiple lead forms** by filtering on Page and Form.

## Facebook Lead Ads Credentials

This node uses **OAuth2 authentication** with Facebook. When you first add the node, you'll be prompted to connect your Facebook account with the following permissions:

- `leads_retrieval` - Required to read lead data
- `pages_show_list` - Required to list your pages
- `pages_manage_metadata` - Required to subscribe to webhooks
- `pages_manage_ads` - Required for lead ads access
- `ads_management` - Required for lead ads access
- `pages_read_engagement` - Required for page access

### Setting Up

1. Go to [Facebook Developers](https://developers.facebook.com/) and create an app (or use existing)
2. In n8n, add the **Facebook Lead Ads Multi-Form Trigger** node
3. Click to create new credentials - this will open Facebook OAuth flow
4. Grant the required permissions
5. Select your **Page** and **Form** from the dropdowns (they load automatically!)

## Webhook Configuration

You need to configure Facebook to send webhooks to your n8n instance:

1. In Facebook Developers, go to your app → Webhooks
2. Add a new subscription for **Page** object
3. Configure:
   - **Callback URL**: Your n8n webhook URL (shown in the trigger node)
   - **Verify Token**: The same string you enter in the **Verify Token** parameter
   - **Fields**: Subscribe to `leadgen`
4. Subscribe your Facebook Page to the app:
   ```bash
   curl -i -X POST "https://graph.facebook.com/{page-id}/subscribed_apps?subscribed_fields=leadgen&access_token={page-access-token}"
   ```

## Facebook Lead Ads Trigger Parameters

### Verify Token

- **Required**: Yes
- **Description**: Custom string for webhook verification. Must match the Verify Token configured in your Facebook App webhook settings.

### Page Name or ID

- **Required**: No
- **Type**: Dropdown (dynamically loaded from your Facebook account)
- **Description**: Select a Facebook Page to filter leads. Leave as "All Pages" to receive leads from all your pages.

### Form Name or ID

- **Required**: No
- **Type**: Dropdown (dynamically loaded based on selected Page)
- **Description**: Select a Lead Form to filter leads. Leave as "All Forms" to receive leads from all forms on the selected page.

### Fetch Full Lead Data

- **Required**: No (default: `true`)
- **Description**: When enabled, fetches complete lead data (email, name, custom fields) from the Facebook Graph API. When disabled, only returns the webhook event metadata.

### Options

- **Graph API Version**: The Facebook Graph API version to use (default: `v18.0`)
- **Lead Fields**: Comma-separated list of fields to fetch from the lead

## Facebook Lead Ads Trigger Output

When a new lead is submitted, the node outputs:

```json
{
	"leadgen_id": "123456789",
	"page_id": "987654321",
	"form_id": "456789123",
	"ad_id": "789123456",
	"created_time": "2024-01-15T10:30:00+0000",
	"emailaddress": "user@example.com",
	"name": "John Doe",
	"phone": "+1234567890",
	"field_data": [
		{ "name": "email", "values": ["user@example.com"] },
		{ "name": "full_name", "values": ["John Doe"] }
	]
}
```

The output is formatted to be directly compatible with the **Smartemailing Contact Importer** node - just connect them together!

## Example Workflow: Facebook Leads to Smartemailing

1. Add **Facebook Lead Ads Trigger** node
2. Configure credentials and optional filters
3. Copy the webhook URL and configure it in your Facebook App
4. Connect to **Smartemailing Contact Importer** node
5. Select your Smartemailing contact list
6. Activate the workflow

---

# Smartemailing Contact Importer

Import contacts into Smartemailing contact lists directly from your n8n workflows.

## Smartemailing Credentials

This node requires Smartemailing API credentials:

1. **Username**: Your Smartemailing API username
2. **Password**: Your Smartemailing API password (API key)

You can find your API credentials in your Smartemailing account settings under API access.

## Parameters

### Contact List Name or ID

- **Required**: Yes
- **Type**: Dropdown (dynamically loaded from your Smartemailing account)
- **Description**: Select the contact list where contacts will be imported. You can also specify an ID using an expression.

### Contact Data Source

- **Required**: No (default: `From Input Items`)
- **Type**: Options
- **Options**:
  - **From Input Items**: Use contact data from previous node's output items
  - **From JSON Parameter**: Provide contact data as a JSON array in the parameter below

### Contact Data (JSON)

- **Required**: Yes (only when Contact Data Source is set to `From JSON Parameter`)
- **Type**: JSON
- **Description**: JSON array of contact objects to import. See [Contact Data Format](#contact-data-format) below.

### Settings

Optional settings for the import process:

- **Update** (default: `true`): Whether to update existing contacts
- **Add Genders** (default: `false`): Whether to add genders to contacts
- **Add Namedays** (default: `false`): Whether to add namedays to contacts
- **Add Salutations** (default: `false`): Whether to add salutations to contacts
- **Preserve Unsubscribed** (default: `true`): Whether to preserve unsubscribed status
- **Skip Invalid Emails** (default: `false`): Whether to skip invalid email addresses

### Double Opt-In Settings

Optional settings for double opt-in email campaigns:

- **Email ID**: ID of the email to send for double opt-in confirmation
- **Sender From**: Email address to send from
- **Sender Name**: Name of the sender
- **Sender Reply To**: Reply-to email address
- **Confirmation Thank You Page URL**: URL to redirect to after confirmation
- **Send To Mode**: Who should receive the double opt-in email
  - `All`: Send to all contacts
  - `New Only`: Send only to new contacts
- **Silence Period Unit**: Unit for the silence period (`days` or `hours`)
- **Silence Period Value**: Value for the silence period (number)

## Contact Data Format

When using **From Input Items**, each input item should be a contact object. The node will automatically:

- Extract contact data from each item's JSON
- If an item has a `data` array, it will use that array
- If an item is itself an array, it will use that array
- Otherwise, it will treat the item as a single contact object

When using **From JSON Parameter**, provide a JSON array in the following format:

```json
[
	{
		"emailaddress": "contact@example.com",
		"name": "John Doe",
		"contactlists": [
			{
				"id": 1,
				"status": "confirmed"
			}
		],
		"customfields": [
			{
				"id": 1,
				"value": "Custom value"
			}
		]
	}
]
```

**Note**: The selected contact list ID will be automatically added to each contact's `contactlists` array if not already present.

### Contact Object Fields

- **emailaddress** (required): Contact's email address
- **name** (optional): Contact's name
- **contactlists** (optional): Array of contact list objects with `id` and `status` (`confirmed` or `unsubscribed`)
- **customfields** (optional): Array of custom field objects with `id` and `value` (or `options` for multi-select)
- **purposes** (optional): Array of purpose objects with `id`, `valid_from`, and `valid_to`
- **preferences** (optional): Object with `contact_preferences` array
- **blacklisted** (optional): Set to `1` to blacklist the contact

For complete field documentation, refer to the [Smartemailing API documentation](https://app.smartemailing.cz/docs/api/v3/index).

## Usage Examples

### Example 1: Import from Previous Node

1. Connect a node that outputs contact data (e.g., Google Sheets, Database)
2. Configure the node to output contact objects with `emailaddress` and other fields
3. Connect to Smartemailing Contact Importer node
4. Select the target contact list
5. Set Contact Data Source to `From Input Items`
6. Configure import settings as needed

### Example 2: Import from JSON

1. Add Smartemailing Contact Importer node
2. Select the target contact list
3. Set Contact Data Source to `From JSON Parameter`
4. Enter JSON array in Contact Data field:

```json
[
	{
		"emailaddress": "user1@example.com",
		"name": "User One"
	},
	{
		"emailaddress": "user2@example.com",
		"name": "User Two"
	}
]
```

5. Configure import settings as needed

## Output

The node returns the response from the Smartemailing API import endpoint, which includes:

- **status**: Import status (`created` on success)
- **contacts_map**: Mapping of email addresses to contact IDs (empty if double opt-in is used)
- **double_opt_in_map**: Mapping for double opt-in requests (if applicable)

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Smartemailing API Documentation](https://app.smartemailing.cz/docs/api/v3/index)
- [Facebook Lead Ads API Documentation](https://developers.facebook.com/docs/marketing-api/guides/lead-ads)
- [Facebook Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Smartemailing API**: v3

## Version History

### 1.1.0

- Added Facebook Lead Ads Multi-Form Trigger node
- Receive real-time leads from Facebook Lead Ads
- **Dynamic Page and Form dropdowns** - just like the built-in trigger!
- Support for filtering by Page and Form (or receive from all)
- OAuth2 authentication with Facebook
- Automatic field mapping for SmartEmailing compatibility

### 1.0.0

- Initial release
- Import contacts to Smartemailing contact lists
- Support for all import settings and double opt-in configuration
