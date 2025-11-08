# n8n-nodes-smartemailing-contact-importer

This n8n community node allows you to import contacts into Smartemailing contact lists directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

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

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Smartemailing API**: v3

## Version History

### 1.0.0

- Initial release
- Import contacts to Smartemailing contact lists
- Support for all import settings and double opt-in configuration
